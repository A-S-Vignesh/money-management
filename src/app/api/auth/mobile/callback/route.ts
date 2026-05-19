// GET /api/auth/mobile/callback?code=...&state=...
//
// Google's redirect target. We:
//   1. Verify the state token we signed in /start (no CSRF, no expiry).
//   2. Exchange the auth code for tokens with Google (server-to-server).
//   3. Verify the returned id_token's signature and audience.
//   4. Find-or-create the user (same bootstrap as /api/auth/mobile/google).
//   5. Sign our mobile JWT.
//   6. Return an HTML page that redirects to the app's deep link
//      (window.location.replace — most browsers refuse to Location: a
//      non-http(s) scheme directly, but client-side navigation works).
//
// expo-web-browser's openAuthSessionAsync watches for the redirect target
// and closes the in-app browser as soon as it sees a URL matching the
// app's returnTo prefix.

import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Account from "@/models/Account";
import {
  signMobileJwt,
  verifyGoogleIdToken,
  verifyMobileState,
} from "@/lib/mobileAuth";

function errorPage(message: string): Response {
  // Browsers stay on this page — there's no app deep link to bounce to
  // when something fails before we have a verified state.
  const escaped = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `<!doctype html><html><head><meta charset="utf-8">
<title>Sign-in failed</title>
<style>body{font:14px/1.4 system-ui;padding:32px;max-width:480px;margin:0 auto;color:#111}h1{font-size:18px;margin:0 0 12px;color:#b91c1c}</style>
</head><body><h1>Sign-in failed</h1><p>${escaped}</p>
<p>Close this window and try again.</p></body></html>`;
  return new Response(html, {
    status: 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function bouncePage(returnUrl: string): Response {
  // <meta refresh> for browsers that block JS in inline scripts; the
  // <a> + <script> are the modern paths. All three converge on the same URL.
  const escaped = returnUrl
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
  const json = JSON.stringify(returnUrl);
  const html = `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=${escaped}">
<title>Returning to app…</title>
<style>body{font:14px/1.4 system-ui;padding:32px;max-width:480px;margin:0 auto;color:#111;text-align:center}a{color:#4f46e5;font-weight:600}</style>
</head><body><p>Returning to the Money Nest app…</p>
<p><a href="${escaped}">Tap here if the app doesn't open automatically</a></p>
<script>window.location.replace(${json})</script>
</body></html>`;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const googleError = url.searchParams.get("error");

  if (googleError) {
    return errorPage(`Google rejected the request: ${googleError}`);
  }
  if (!code || !stateParam) {
    return errorPage("Missing code or state from Google.");
  }

  const state = verifyMobileState(stateParam);
  if (!state) {
    return errorPage(
      "Invalid or expired sign-in state. Start the sign-in flow again.",
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return errorPage("Server is missing Google OAuth credentials.");
  }

  // Step 2: server-to-server code exchange (the client secret never leaves
  // the backend; that's the whole reason we relay).
  const callbackUrl = `${url.origin}/api/auth/mobile/callback`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    const text = await tokenRes.text().catch(() => "");
    return errorPage(`Token exchange with Google failed (${tokenRes.status}). ${text.slice(0, 200)}`);
  }
  const tokens = (await tokenRes.json()) as {
    id_token?: string;
    access_token?: string;
  };
  if (!tokens.id_token) {
    return errorPage("Google didn't return an ID token. Try again.");
  }

  // Step 3: verify the id_token's signature + audience.
  const profile = await verifyGoogleIdToken(tokens.id_token);
  if (!profile) {
    return errorPage("Could not verify the ID token from Google.");
  }

  // Step 4: find-or-create user (mirrors /api/auth/mobile/google).
  await connectToDatabase();
  let user = await User.findOne({ email: profile.email });
  if (!user) {
    user = await User.create({
      name: profile.name || profile.email.split("@")[0],
      email: profile.email,
      image: profile.picture,
      googleId: profile.sub,
      currency: "INR",
      lang: "en",
      notifications: true,
      twoFactorAuth: false,
    });
    await Account.create({
      userId: user._id,
      name: "Deleted Account",
      balance: 0,
      type: "system",
      isSystem: true,
    });
    await Account.create({
      userId: user._id,
      name: "Main Wallet",
      balance: 0,
      type: "cash",
      isSystem: false,
    });
  } else if (!user.googleId) {
    user.googleId = profile.sub;
    await user.save();
  }

  // Step 5: sign the mobile JWT.
  const token = signMobileJwt({
    sub: user._id.toString(),
    email: user.email,
  });

  // Step 6: build the deep-link return URL by hand.
  //
  // We MUST NOT use `new URL(state.returnTo)` here — for non-special schemes
  // like `exp://` and `moneynest://`, Node's URL parser treats the URL as
  // opaque and `.toString()` doesn't roundtrip cleanly (port + path get
  // re-encoded incorrectly). The query params end up mangled by the time
  // they reach the app, and the deep-link handler can't read `token`.
  // Manual concatenation avoids the parser entirely.
  const userPayload = JSON.stringify({
    _id: user._id.toString(),
    email: user.email,
    name: user.name,
    image: user.image,
  });
  const sep = state.returnTo.includes("?") ? "&" : "?";
  const returnUrl =
    state.returnTo +
    sep +
    "token=" +
    encodeURIComponent(token) +
    "&user=" +
    encodeURIComponent(userPayload);

  return bouncePage(returnUrl);
}
