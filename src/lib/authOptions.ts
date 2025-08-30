// lib/auth.ts
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/mongodb";
import User, { IUser } from "@/models/User";
import Account from "@/models/Account";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  session: {
    strategy: "jwt", // ✅ use JWT sessions (better scaling)
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    // --- SIGN IN ---
    async signIn({ user, profile }) {
      await connectToDatabase();

      let existingUser = await User.findOne({ email: user.email });

      if (!existingUser) {
        // 1. Create user
        existingUser = await User.create({
          name: user.name,
          email: user.email,
          image: user.image,
          googleId: profile?.sub,
          currency: "INR",
          lang: "en",
          notifications: true,
          twoFactorAuth: false,
        });

        // 2. Create Deleted Account
        await Account.create({
          userId: existingUser._id,
          name: "Deleted Account",
          balance: 0,
          type: "system",
          isSystem: true,
        });

        // 3. Create Main Account
        await Account.create({
          userId: existingUser._id,
          name: "Main Wallet",
          balance: 0,
          type: "cash",
          isSystem: false,
        });
      }

      return true;
    },

    // --- JWT CALLBACK ---
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await User.findOne({ email: user.email });
        if (dbUser) {
          token._id = dbUser._id.toString();
          token.role = dbUser.role;
          token.premium = dbUser.premium;
        }
      }
      return token;
    },

    // --- SESSION CALLBACK ---
    async session({ session, token }) {
      if (session.user) {
        session.user._id = token._id;
        session.user.role = token.role;
        session.user.premium = token.premium;
      }
      return session;
    },
  },
};
