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
  { name: "Food", icon: Utensils, color: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200" },
  { name: "Housing", icon: Home, color: "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200" },
  { name: "Transport", icon: Car, color: "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200" },
  { name: "Lifestyle", icon: Activity, color: "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200" },
  {
    name: "Shopping",
    icon: ShoppingBag,
    color: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200",
  },
  { name: "Learning", icon: BookOpen, color: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200" },
  { name: "Personal", icon: Gift, color: "bg-pink-100 dark:bg-pink-900/40 text-pink-800 dark:text-pink-200" },
  { name: "Salary", icon: Briefcase, color: "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200" },
  { name: "Other", icon: DollarSign, color: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200" },
];

export const categoryMap: Record<CategoryName, Category> = Object.fromEntries(
  categories.map((c) => [c.name, c])
) as Record<CategoryName, Category>;
