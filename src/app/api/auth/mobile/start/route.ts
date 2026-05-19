// GET /api/auth/mobile/start
//
// Entry point of the mobile OAuth relay. The mobile app opens this URL in
// an in-app browser; we sign a short-lived state token carrying the app's
// return-URL (`exp://...` or `moneynest://...`), then 302 to Google.
//
// Why a relay instead of letting the mobile app talk to Google directly?
// Google's Web OAuth client only accepts https:// (or http://localhost)
// redirect URIs — it rejects custom schemes like `exp://`. By routing
// Google's redirect through our backend, only our backend URL ever appears
// in Google's redirect-URI whitelist. The backend then bounces the user
// back to the app via the (signed-state-verified) custom scheme.

import { isAllowedReturnUrl, signMobileState } from "@/lib/mobileAuth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const returnTo = url.searchParams.get("returnTo");

  if (!returnTo) {
    return new Response("Missing returnTo query param", { status: 400 });
  }
  if (!isAllowedReturnUrl(returnTo)) {
    return new Response(
      "returnTo must use one of the allowed app schemes (exp://, exp+money-nest://, moneynest://)",
      { status: 400 },
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return new Response("Server missing GOOGLE_CLIENT_ID", { status: 500 });
  }

  // The callback URL must be registered in Google Cloud Console as an
  // authorised redirect URI on the Web OAuth client. Using `url.origin`
  // means dev and prod automatically use the right host.
  const callbackUrl = `${url.origin}/api/auth/mobile/callback`;

  const state = signMobileState({ returnTo });

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", callbackUrl);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("access_type", "online");
  authUrl.searchParams.set("prompt", "select_account");

  return Response.redirect(authUrl.toString(), 302);
}
