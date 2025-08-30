import { CategoryName } from "@/utils/categories";

export interface ITransaction {
  _id: string;
  fromAccountId?: string;
  toAccountId?: string;
  description: string;
  amount: number;
  category: CategoryName;
  type: "income" | "expense" | "transfer";
  date: string;
}
