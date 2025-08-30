import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import Budget from "@/models/Budget";
import { connectToDatabase } from "@/lib/mongodb";
interface BudgetBody {
  name: string;
  category: string;
  allocated: number;
  period: string;
  startDate: string;
  endDate: string;
}



export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
    }
  try {
    await connectToDatabase();
    const budgets = await Budget.find({ userId });
    if (!budgets) {
      return new Response("Budget not found", { status: 404 });
    }
    return new Response(JSON.stringify(budgets), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  catch (error) {
    console.error("Error fetching budget:", error);
    return new Response("Internal Server Error", { status: 500 });
  } 
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    await connectToDatabase();
    const body: BudgetBody = await req.json();
    const newBudget = await Budget.create({ userId: userId, ...body });
    return new Response(JSON.stringify(newBudget), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Budget creation failed:", error);
    return new Response("Failed to create budget", { status: 500 });
  }

}
