// app/balance/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import BalancePage from "@/allpages/BalancePage";

export default async function Balance() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login"); // 👈 if not logged in, go to login
  }

  return (
    <BalancePage />
  );
}
