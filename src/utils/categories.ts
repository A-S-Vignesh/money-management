// categories.ts
import {
  Utensils,
  Home,
  Car,
  Activity,
  ShoppingBag,
  BookOpen,
  Gift,
  Briefcase,
  DollarSign,
  type LucideIcon, // ✅ type import
} from "lucide-react";

export type CategoryName =
  | "Food"
  | "Housing"
  | "Transport"
  | "Lifestyle"
  | "Shopping"
  | "Learning"
  | "Personal"
  | "Salary"
  | "Transfer"
  | "Other";

export interface Category {
  name: CategoryName;
  icon: LucideIcon; // ✅ store the component, not JSX
  color: string;
}

export const categories: Category[] = [
  { name: "Food", icon: Utensils, color: "bg-red-100 text-red-800" },
  { name: "Housing", icon: Home, color: "bg-blue-100 text-blue-800" },
  { name: "Transport", icon: Car, color: "bg-green-100 text-green-800" },
  { name: "Lifestyle", icon: Activity, color: "bg-purple-100 text-purple-800" },
  {
    name: "Shopping",
    icon: ShoppingBag,
    color: "bg-yellow-100 text-yellow-800",
  },
  { name: "Learning", icon: BookOpen, color: "bg-indigo-100 text-indigo-800" },
  { name: "Personal", icon: Gift, color: "bg-pink-100 text-pink-800" },
  { name: "Salary", icon: Briefcase, color: "bg-green-100 text-green-800" },
  { name: "Other", icon: DollarSign, color: "bg-gray-100 text-gray-800" },
];

export const categoryMap: Record<CategoryName, Category> = Object.fromEntries(
  categories.map((c) => [c.name, c])
) as Record<CategoryName, Category>;
