// app/balance/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import GoalsPage from "@/allpages/Goalspage";

export default async function Balance() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login"); // 👈 if not logged in, go to login
  }

  return <GoalsPage />;
}
