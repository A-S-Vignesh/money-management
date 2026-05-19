// POST /api/auth/mobile/google
//
// Mobile sign-in: trade a Google ID token (from native Google Sign-In SDK)
// for a Money Nest JWT that the mobile app stores in SecureStore and sends
// as `Authorization: Bearer <token>` on every subsequent request.
//
// User provisioning mirrors authOptions.signIn so first-time mobile users
// get the same Deleted Account + Main Wallet bootstrap as web users.

import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Account from "@/models/Account";
import { signMobileJwt, verifyGoogleIdToken } from "@/lib/mobileAuth";
import { z } from "zod";

const bodySchema = z.object({
  idToken: z.string().min(10, "idToken is required"),
});

export async function POST(req: Request) {
  let parsed;
  try {
    const body = await req.json();
    parsed = bodySchema.safeParse(body);
  } catch {
    return Response.json(
      { success: false, type: "error", message: "Invalid JSON body" },
      { status: 400 },
    );
  }
  if (!parsed.success) {
    return Response.json(
      {
        success: false,
        type: "error",
        message: "idToken is required",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const profile = await verifyGoogleIdToken(parsed.data.idToken);
  if (!profile) {
    return Response.json(
      {
        success: false,
        type: "error",
        message: "Could not verify Google ID token",
      },
      { status: 401 },
    );
  }

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

    // Bootstrap accounts — same as NextAuth's signIn callback for web.
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
    // Existing email-only user signing in via mobile for the first time —
    // backfill googleId so future verifications match.
    user.googleId = profile.sub;
    await user.save();
  }

  const token = signMobileJwt({
    sub: user._id.toString(),
    email: user.email,
  });

  return Response.json({
    success: true,
    type: "success",
    data: {
      token,
      user: {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        image: user.image,
      },
    },
  });
}
