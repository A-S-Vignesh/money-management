// Extend NextAuth types
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

// ✅ Module augmentation to add custom fields
declare module "next-auth" {
  interface Session {
    user: {
      _id: string;
      name: string;
      email: string;
      image?: string;
      role: "user" | "admin";
      premium: "free" | "pro" | "family";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    _id: string;
    role: "user" | "admin";
    premium: "free" | "pro" | "family";
  }
}
