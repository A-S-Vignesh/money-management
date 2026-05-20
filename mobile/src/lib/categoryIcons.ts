// lib/categoryIcons.ts
// Single source of truth mapping a category name to its Lucide icon.
// Used by TxRow, CategoryPicker, and anywhere else that displays a
// category visually. Mirrors the Mobile UI mock's CATEGORIES table.

import {
  Book,
  Briefcase,
  Car,
  Coffee,
  CreditCard,
  Gift,
  Home,
  Plane,
  ShoppingBag,
  Stethoscope,
  Tag,
  TrendingUp,
  Tv,
  Zap,
  type LucideIcon,
} from "lucide-react-native";

const TABLE: Record<string, LucideIcon> = {
  Food: Coffee,
  Housing: Home,
  Transport: Car,
  Lifestyle: Tv,
  Entertainment: Tv,
  Utilities: Zap,
  Shopping: ShoppingBag,
  Health: Stethoscope,
  Learning: Book,
  Education: Book,
  Travel: Plane,
  Personal: Gift,
  Salary: Briefcase,
  Freelance: Briefcase,
  Gift: Gift,
  Investment: TrendingUp,
  "Investment Buy": TrendingUp,
  "Investment Sell": TrendingUp,
  Dividend: TrendingUp,
  Transfer: CreditCard,
  Other: Tag,
};

export function getCategoryIcon(name: string): LucideIcon {
  return TABLE[name] ?? Tag;
}
