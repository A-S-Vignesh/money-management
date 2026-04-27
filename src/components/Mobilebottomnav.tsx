"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, List, Plus, PieChart, Menu, LucideIcon } from "lucide-react";

// ─── Tune these two values only — everything else adapts ─────────────────────
const FAB_SIZE = 52; // px → diameter of the FAB circle
const NAV_HEIGHT = 64; // px → height of the bottom bar
// ─────────────────────────────────────────────────────────────────────────────

const PAD = 10;
const VB_W = 390;
const VB_H = 80;
const FLAT_Y = 28;

const cx = VB_W / 2;
const nr = FAB_SIZE / 2 + PAD;
const dep = nr * 0.38;
const spr = nr * 1.05;

const SVG_PATH = [
  `M0 ${FLAT_Y}`,
  `L${cx - nr - spr * 0.55} ${FLAT_Y}`,
  `C${cx - nr - spr * 0.08} ${FLAT_Y} ${cx - nr} ${FLAT_Y + dep} ${cx - nr} ${FLAT_Y + nr * 0.52}`,
  `A${nr} ${nr} 0 0 0 ${cx + nr} ${FLAT_Y + nr * 0.52}`,
  `C${cx + nr} ${FLAT_Y + dep} ${cx + nr + spr * 0.08} ${FLAT_Y} ${cx + nr + spr * 0.55} ${FLAT_Y}`,
  `L${VB_W} ${FLAT_Y} L${VB_W} ${VB_H} L0 ${VB_H} Z`,
].join(" ");

const FAB_LIFT = FAB_SIZE / 2 + PAD / 2 - 4;

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

type NavItem = NavLinkItem | NavButtonItem | null;

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
    {
      type: "link",
      href: "/dashboard",
      icon: Home,
      label: "Home",
    },
    {
      type: "link",
      href: "/dashboard/transactions",
      icon: List,
      label: "History",
    },
    null, // FAB spacer
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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
      <div className="relative" style={{ height: NAV_HEIGHT }}>
        {/* ── SVG curved background ── */}
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "110%",
            bottom: 0,
            top: "auto",
            filter: "drop-shadow(0 -1px 0 #e5e7eb)",
          }}
        >
          <path d={SVG_PATH} fill="white" />
        </svg>

        {/* ── Nav items row ── */}
        <div
          className="relative z-10 flex justify-around items-center w-full h-full px-1"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          {navItems.map((item, index) => {
            if (item === null) {
              return (
                <div
                  key="fab-gap"
                  style={{ width: FAB_SIZE + PAD * 2, flexShrink: 0 }}
                />
              );
            }

            const baseClass =
              "flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] w-16 relative active:scale-90 transition-transform duration-150";

            if (item.type === "link") {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${baseClass} ${active ? "text-indigo-600" : "text-gray-400"}`}
                >
                  <item.icon size={20} />
                  <span className="text-[10px] font-medium leading-none">
                    {item.label}
                  </span>
                  {active && <ActiveDot />}
                </Link>
              );
            }

            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`${baseClass} bg-transparent border-none cursor-pointer ${
                  item.active ? "text-indigo-600" : "text-gray-400"
                }`}
              >
                <item.icon size={20} />
                <span className="text-[10px] font-medium leading-none">
                  {item.label}
                </span>
                {item.active && <ActiveDot />}
              </button>
            );
          })}
        </div>

        {/* ── FAB ── */}
        <button
          onClick={() => {
            setShowQuickAdd(true);
            setQuickErrors({});
            setQuickType("expense");
          }}
          aria-label="Add transaction"
          className="absolute left-1/2 -translate-x-1/2 bg-indigo-600 text-white
                     flex items-center justify-center
                     active:scale-90 transition-all duration-150
                     hover:bg-indigo-500
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
          style={{
            width: FAB_SIZE,
            height: FAB_SIZE,
            borderRadius: FAB_SIZE / 2,
            bottom: FAB_LIFT,
            zIndex: 20,
            boxShadow: "0 4px 14px -2px rgba(79, 70, 229, 0.55)",
          }}
        >
          <Plus size={Math.round(FAB_SIZE * 0.46)} strokeWidth={2.2} />
        </button>
      </div>

      {/* iOS home indicator safe area */}
      <div
        className="bg-white"
        style={{ height: "env(safe-area-inset-bottom, 0px)" }}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActiveDot() {
  return (
    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-600" />
  );
}
