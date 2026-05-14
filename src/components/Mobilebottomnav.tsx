"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  List,
  Plus,
  PieChart,
  Menu,
  CreditCard,
  LucideIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavLinkItem {
  type: "link";
  href: string;
  icon: LucideIcon;
  label: string;
}

interface NavButtonItem {
  type: "button";
  id: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}

type NavItem = NavLinkItem | NavButtonItem;

interface MobileBottomNavProps {
  toggleSidebar: () => void;
  sidebarOpen: boolean;
  setShowQuickAdd: (value: boolean) => void;
  setQuickErrors: (value: Record<string, string>) => void;
  setQuickType: (value: "expense" | "income") => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MobileBottomNav({
  toggleSidebar,
  sidebarOpen,
  setShowQuickAdd,
  setQuickErrors,
  setQuickType,
}: MobileBottomNavProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { type: "link", href: "/dashboard", icon: Home, label: "Home" },
    {
      type: "link",
      href: "/dashboard/balance",
      icon: CreditCard,
      label: "Balance",
    },
    {
      type: "link",
      href: "/dashboard/transactions",
      icon: List,
      label: "History",
    },
    {
      type: "link",
      href: "/dashboard/budgets",
      icon: PieChart,
      label: "Budgets",
    },
    {
      type: "button",
      id: "menu",
      icon: Menu,
      label: "Menu",
      active: sidebarOpen,
      onClick: toggleSidebar,
    },
  ];

  return (
    <>
      {/* ── Floating Action Button (bottom-right) ── */}
      <button
        onClick={() => {
          setShowQuickAdd(true);
          setQuickErrors({});
          setQuickType("expense");
        }}
        aria-label="Add transaction"
        className="md:hidden fixed right-4 z-50
                   w-14 h-14 rounded-full
                   bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600
                   text-white flex items-center justify-center
                   ring-4 ring-white
                   shadow-[0_10px_24px_-6px_rgba(79,70,229,0.6)]
                   hover:shadow-[0_14px_28px_-6px_rgba(79,70,229,0.75)]
                   active:scale-90 transition-all duration-200
                   focus-visible:outline-none focus-visible:ring-4
                   focus-visible:ring-indigo-300"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 88px)",
        }}
      >
        <Plus size={26} strokeWidth={2.4} />
      </button>

      {/* ── Bottom navigation pill ── */}
      <div
        className="md:hidden fixed bottom-0 inset-x-0 z-40 px-3 pointer-events-none"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
        }}
      >
        <nav
          className="pointer-events-auto flex items-stretch justify-between
                     bg-white/95 backdrop-blur-md
                     border border-gray-100 rounded-3xl
                     shadow-[0_8px_24px_-6px_rgba(15,23,42,0.12)]
                     px-1.5 py-2"
          aria-label="Primary"
        >
          {navItems.map((item) => {
            const active =
              item.type === "link" ? pathname === item.href : item.active;

            const className = `relative flex-1 flex flex-col items-center justify-center gap-1
                               min-h-[48px] py-1.5 px-1 rounded-2xl
                               active:scale-95 transition-all duration-200
                               ${
                                 active
                                   ? "bg-indigo-50 text-indigo-600"
                                   : "text-gray-400 hover:text-gray-600"
                               }`;

            const content = (
              <>
                <item.icon
                  size={20}
                  strokeWidth={active ? 2.4 : 2}
                  className="transition-transform duration-200"
                />
                <span className="text-[10px] font-semibold leading-none tracking-tight">
                  {item.label}
                </span>
              </>
            );

            if (item.type === "link") {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={className}
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`${className} bg-transparent border-none cursor-pointer`}
              >
                {content}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
