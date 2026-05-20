// app/api/account/delete/route.ts
//
// DELETE → permanently wipe the logged-in user and all their data.
// GDPR right-to-erasure compliance.
//
// Requires the user to send { confirmation: "DELETE" } in the body so a
// stray request can't nuke an account. The mutation is wrapped in a Mongo
// session in production for atomicity (best-effort in dev).
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";
import Budget from "@/models/Budget";
import Goal from "@/models/Goal";
import Holding from "@/models/Holding";
import Notification from "@/models/Notification";
import PushSubscription from "@/models/PushSubscription";
import mongoose from "mongoose";
import { getUserId } from "@/lib/mobileAuth";

const isProd = process.env.NODE_ENV === "production";

export async function DELETE(req: Request) {
  const userId = await getUserId(req);
  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 },
    );
  }

  // Typed confirmation check — defense against accidental requests
  let body: { confirmation?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  if (body.confirmation !== "DELETE") {
    return Response.json(
      {
        message: "Send { confirmation: \"DELETE\" } to confirm deletion",
        type: "error",
        success: false,
      },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();
    const userObjectId = new mongoose.Types.ObjectId(userId);

    let dbSession: mongoose.ClientSession | undefined;
    if (isProd) {
      dbSession = await mongoose.startSession();
      dbSession.startTransaction();
    }

    try {
      const opts = isProd ? { session: dbSession } : undefined;
      const filter = { userId: userObjectId };

      // Delete every user-scoped collection. Order doesn't matter — these
      // are independent collections, no FK constraints.
      const results = await Promise.all([
        Transaction.deleteMany(filter, opts),
        Account.deleteMany(filter, opts),
        Budget.deleteMany(filter, opts),
        Goal.deleteMany(filter, opts),
        Holding.deleteMany(filter, opts),
        Notification.deleteMany(filter, opts),
        PushSubscription.deleteMany(filter, opts),
      ]);

      // Finally, the user record itself
      await User.deleteOne({ _id: userObjectId }, opts);

      if (isProd && dbSession) {
        await dbSession.commitTransaction();
        dbSession.endSession();
      }

      const deleted = {
        transactions: results[0].deletedCount,
        accounts: results[1].deletedCount,
        budgets: results[2].deletedCount,
        goals: results[3].deletedCount,
        holdings: results[4].deletedCount,
        notifications: results[5].deletedCount,
        pushSubscriptions: results[6].deletedCount,
      };

      // Clear the session cookie so the now-orphaned session can't be reused.
      // The client should also call signOut() after this returns.
      const res = Response.json({
        message: "Account permanently deleted",
        type: "success",
        success: true,
        data: deleted,
      });
      // Best-effort cookie nuke for both common NextAuth cookie names
      res.headers.append(
        "Set-Cookie",
        "next-auth.session-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax",
      );
      res.headers.append(
        "Set-Cookie",
        "__Secure-next-auth.session-token=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax",
      );
      return res;
    } catch (txErr) {
      if (isProd && dbSession) {
        await dbSession.abortTransaction();
        dbSession.endSession();
      }
      throw txErr;
    }
  } catch (error) {
    console.error("DELETE /api/account/delete error:", error);
    return Response.json(
      { message: "Failed to delete account", type: "error", success: false },
      { status: 500 },
    );
  }
}
