"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useToastStore } from "@/store/useToastStore";
import { useProfileStore } from "@/store/useProfileStore";
import { useAccountStore } from "@/store/useAccountStore";
import { useBudgetStore } from "@/store/useBudgetStore";
import { useGoalStore } from "@/store/useGoalStore";
import Toast from "@/components/Toast";
import { useAddTransaction } from "@/hooks/transactions/useAddTransaction";
import { useNotifications } from "@/hooks/notifications/useNotifications";
import { useMarkAsRead } from "@/hooks/notifications/useMarkAsRead";
import { useMarkAllAsRead } from "@/hooks/notifications/useMarkAllAsRead";
import { useAccounts } from "@/hooks/accounts/useAccounts";
import {
  createTransactionSchema,
  categoryNames,
  type CreateTransactionInput,
} from "@/validations/transaction";
import {
  Home,
  CreditCard,
  List,
  PieChart,
  Bell,
  User,
  BarChart2,
  DollarSign,
  TrendingUp,
  Plus,
  LogOut,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
  Mail,
  MessageSquare,
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
} from "lucide-react";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: <Home size={18} /> },
  {
    href: "/dashboard/balance",
    label: "Balance",
    icon: <CreditCard size={18} />,
  },
  {
    href: "/dashboard/transactions",
    label: "Transactions",
    icon: <List size={18} />,
  },
  {
    href: "/dashboard/budgets",
    label: "Budgets",
    icon: <PieChart size={18} />,
  },
  {
    href: "/dashboard/investments",
    label: "Investments",
    icon: <TrendingUp size={18} />,
  },
  {
    href: "/dashboard/reports",
    label: "Reports",
    icon: <BarChart2 size={18} />,
  },
  { href: "/dashboard/goals", label: "Goals", icon: <DollarSign size={18} /> },
];

const secondaryItems = [
  { href: "/dashboard/profile", label: "Profile", icon: <User size={18} /> },
  // {
  //   href: "/dashboard/settings",
  //   label: "Settings",
  //   icon: <Settings size={18} />,
  // },
];

// ─── Form Errors type ────────────────────────────────────────────────────
interface QuickAddErrors {
  type?: string[];
  description?: string[];
  amount?: string[];
  date?: string[];
  category?: string[];
  fromAccountId?: string[];
  toAccountId?: string[];
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data: session } = useSession();

  const { toasts, removeToast } = useToastStore();
  // const { fetchAccounts } = useAccountStore();
  // const { fetchProfile } = useProfileStore();
  // const { fetchBudgets } = useBudgetStore();
  // const { fetchGoals } = useGoalStore();

  // React Query hooks for quick-add modal
  const addTransaction = useAddTransaction();
  const { data: accountsData } = useAccounts({
    page: 1,
    limit: 100,
    includeGoals: true,
  });

  // Notification hooks for bell dropdown
  const { data: notifData } = useNotifications({ page: 1, limit: 5 });
  const unreadCount = notifData?.unreadCount ?? 0;
  
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const recentNotifications = notifData?.data ?? [];
  const accounts = accountsData?.data ?? [];

  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickType, setQuickType] = useState<"income" | "expense" | "transfer">(
    "expense",
  );
  const [quickErrors, setQuickErrors] = useState<QuickAddErrors>({});
  const notifRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const userName = session?.user?.name || "Unknown User";
  const userEmail = session?.user?.email || "No email";
  const userImage = session?.user?.image || "/images/avathar/default.png";

  // Handle click outside to close dropdowns
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setIsNotifOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // useEffect(() => {
  //   fetchAccounts();
  //   fetchProfile();
  //   fetchBudgets();
  //   fetchGoals();
  // }, []);

  // ── Quick-add handler ──────────────────────────────────────────────────
  const handleQuickAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setQuickErrors({});

    const fd = new FormData(e.currentTarget);
    const raw = {
      type: quickType,
      description: (fd.get("description")?.toString() || "").trim(),
      amount: Number(fd.get("amount")) || 0,
      date: fd.get("date")?.toString() || "",
      category:
        quickType === "transfer"
          ? "Transfer"
          : fd.get("category")?.toString() || "",
      fromAccountId: fd.get("fromAccountId")?.toString() || undefined,
      toAccountId: fd.get("toAccountId")?.toString() || undefined,
    };

    const result = createTransactionSchema.safeParse(raw);
    if (!result.success) {
      setQuickErrors(result.error.flatten().fieldErrors as QuickAddErrors);
      return;
    }

    try {
      await addTransaction.mutateAsync(result.data as CreateTransactionInput);
      setShowQuickAdd(false);
      setQuickErrors({});
      (e.target as HTMLFormElement).reset();
    } catch {
      // handled by mutation onError
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleCollapse = () => setCollapsed(!collapsed);
  const toggleNotif = () => setIsNotifOpen(!isNotifOpen);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  return (
    <div className="flex bg-gray-50 h-[100dvh] w-full overflow-hidden">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar (Hidden on mobile) */}
      <aside
        className={`hidden md:flex z-50 top-0 h-full left-0 overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800 text-white flex-col transition-all duration-300 ease-in-out ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center">
            {collapsed ? (
              <div className=" w-10 h-10 rounded-lg flex items-center justify-center">
                <Image
                  src={"/images/logo/mainlogo2.png"}
                  alt="Money Nest Logo"
                  width={669}
                  height={669}
                  className="w-12 h-12"
                />
              </div>
            ) : (
              <Image
                src={"/images/logo/mainlogo.png"}
                alt="Money Nest Logo"
                width={1500}
                height={500}
                className="w-40 h-12"
              />
            )}
          </div>
          <div className="flex gap-2 items-center">
            {!isMobile && (
              <button
                className="text-gray-300 hover:text-white"
                onClick={toggleCollapse}
              >
                {collapsed ? (
                  <ChevronsRight size={20} />
                ) : (
                  <ChevronsLeft size={20} />
                )}
              </button>
            )}
            {isMobile && (
              <button
                className="text-gray-300 hover:text-white"
                onClick={closeSidebar}
              >
                <X size={24} />
              </button>
            )}
          </div>
        </div>

        {/* Add Transaction Button */}
        <div className="my-4 px-4">
          <button
            onClick={() => {
              setShowQuickAdd(true);
              setQuickErrors({});
              setQuickType("expense");
            }}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all ${
              collapsed
                ? "bg-indigo-600 hover:bg-indigo-700 justify-center px-0"
                : "bg-indigo-600 hover:bg-indigo-700 px-4"
            }`}
          >
            <Plus size={16} />
            {!collapsed && <span>Add Transaction</span>}
          </button>
        </div>

        {/* Main Menu */}
        <nav className="flex-1 py-4 px-2 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeSidebar}
                  className={`flex items-center py-3 px-4 text-sm rounded-lg mx-2 transition-colors ${
                    pathname === item.href
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-gray-300 hover:bg-gray-750"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {!collapsed && item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Secondary Navigation */}
        <div className="py-4 px-2 border-t border-gray-700">
          <ul className="space-y-1">
            {secondaryItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeSidebar}
                  className={`flex items-center py-3 px-4 text-sm rounded-lg mx-2 transition-colors ${
                    pathname === item.href
                      ? "bg-indigo-600 text-white"
                      : "text-gray-300 hover:bg-gray-750"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {!collapsed && item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative">
                  <Image
                    src={userImage}
                    alt={userName}
                    width={40}
                    height={40}
                    className="w-10 h-10 bg-gray-200 border-2 border-dashed rounded-xl"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-gray-400">{userEmail}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {/* <button className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700">
                  <HelpCircle size={18} />
                </button> */}
                <button
                  onClick={() => signOut()}
                  className="text-gray-400 cursor-pointer hover:text-white p-1 rounded hover:bg-gray-700"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between safe-area-top">
          <div className="flex items-center">
            {/* Safe area padding for mobile notches is handled globally or via safe-area-top class if defined */}
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {menuItems.find((item) => item.href === pathname)?.label ||
                  secondaryItems.find((item) => item.href === pathname)
                    ?.label ||
                  "Dashboard"}
              </h1>
              <p className="text-sm text-gray-600">Your financial overview</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full cursor-pointer"
                onClick={toggleNotif}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Menu */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-xl overflow-hidden z-50 border border-gray-200">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Notifications
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {unreadCount > 0
                          ? `${unreadCount} unread`
                          : "All caught up!"}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                        onClick={() => markAllAsRead.mutate()}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {recentNotifications.length === 0 ? (
                      <div className="py-10 text-center">
                        <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                          <Bell size={20} className="text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">
                          No notifications yet
                        </p>
                      </div>
                    ) : (
                      recentNotifications.map(
                        (n: {
                          _id: string;
                          type: string;
                          title: string;
                          message: string;
                          isRead: boolean;
                          createdAt: string;
                        }) => (
                          <div
                            key={n._id}
                            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors ${
                              !n.isRead ? "bg-indigo-50/50" : ""
                            }`}
                            onClick={() => {
                              if (!n.isRead) markAsRead.mutate(n._id);
                            }}
                          >
                            <div className="flex gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  n.type === "budget"
                                    ? "bg-orange-100"
                                    : n.type === "goal"
                                      ? "bg-green-100"
                                      : n.type === "transaction"
                                        ? "bg-blue-100"
                                        : "bg-gray-100"
                                }`}
                              >
                                {n.type === "budget" ? (
                                  <PieChart
                                    size={14}
                                    className="text-orange-600"
                                  />
                                ) : n.type === "goal" ? (
                                  <DollarSign
                                    size={14}
                                    className="text-green-600"
                                  />
                                ) : n.type === "transaction" ? (
                                  <CreditCard
                                    size={14}
                                    className="text-blue-600"
                                  />
                                ) : (
                                  <Bell size={14} className="text-gray-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p
                                    className={`text-sm truncate ${!n.isRead ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}
                                  >
                                    {n.title}
                                  </p>
                                  {!n.isRead && (
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                  {n.message}
                                </p>
                                <p className="text-[11px] text-gray-400 mt-1">
                                  {(() => {
                                    const diff =
                                      Date.now() -
                                      new Date(n.createdAt).getTime();
                                    const mins = Math.floor(diff / 60000);
                                    if (mins < 1) return "Just now";
                                    if (mins < 60) return `${mins}m ago`;
                                    const hrs = Math.floor(mins / 60);
                                    if (hrs < 24) return `${hrs}h ago`;
                                    const days = Math.floor(hrs / 24);
                                    return `${days}d ago`;
                                  })()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ),
                      )
                    )}
                  </div>

                  <div className="p-3 text-center border-t border-gray-100">
                    <Link
                      href="/dashboard/notifications"
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      onClick={() => setIsNotifOpen(false)}
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-gray-200"></div>

            {/* User Profile Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                className="flex items-center focus:outline-none"
                onClick={toggleUserMenu}
              >
                <Image
                  src={userImage || "/images/user/avatar-1.png"}
                  alt={userName}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full border-2 border-gray-300 mr-2"
                />
                <span className="text-sm font-medium hidden sm:block">
                  {userName}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center">
                      <Image
                        src={userImage}
                        alt={userName}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full border-2 border-gray-300 mr-2"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{userName}</p>
                        <p className="text-xs text-gray-500">{userEmail}</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/dashboard/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Your Profile
                    </Link>
                    {/* <Link
                      href="/dashboard/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Settings
                    </Link> */}
                    {/* <Link
                      href="/dashboard/billing"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Billing
                    </Link> */}
                  </div>
                  <div className="py-1 border-t border-gray-100">
                    <button
                      onClick={() => signOut()}
                      className="w-full cursor-pointer text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center"
                    >
                      <LogOut size={16} className="mr-2" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 pb-24 md:pb-6">
          {children}
          {/* Toast Notifications */}
          <div className="fixed z-[100] pointer-events-none flex flex-col gap-3 bottom-24 md:bottom-5 md:top-7 left-1/2 -translate-x-1/2 items-center md:right-7 md:left-auto md:translate-x-0 md:items-end">
            {toasts.map((toast) => (
              <Toast key={toast.id} {...toast} onClose={removeToast} />
            ))}
          </div>
        </div>
        <footer className="hidden md:block bg-white border-t border-gray-200 py-4 px-6 text-center text-sm text-gray-600">
          &copy; {new Date().getFullYear()} Money Manager. All rights reserved.
        </footer>
      </main>

      {/* ─── Mobile Bottom Navigation ──────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 pb-safe z-50 px-2">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center w-16 h-full ${
            pathname === "/dashboard" ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Home size={20} className={pathname === "/dashboard" ? "fill-indigo-100" : ""} />
          <span className="text-[10px] mt-1 font-medium">Home</span>
        </Link>
        <Link
          href="/dashboard/transactions"
          className={`flex flex-col items-center justify-center w-16 h-full ${
            pathname === "/dashboard/transactions" ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <List size={20} className={pathname === "/dashboard/transactions" ? "fill-indigo-100" : ""} />
          <span className="text-[10px] mt-1 font-medium">History</span>
        </Link>

        {/* Floating Action Button for Add Transaction */}
        <div className="flex flex-col items-center justify-center w-16 h-full -mt-6">
          <button
            onClick={() => {
              setShowQuickAdd(true);
              setQuickErrors({});
              setQuickType("expense");
            }}
            className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-transform active:scale-95"
          >
            <Plus size={24} />
          </button>
        </div>

        <Link
          href="/dashboard/budgets"
          className={`flex flex-col items-center justify-center w-16 h-full ${
            pathname === "/dashboard/budgets" ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <PieChart size={20} className={pathname === "/dashboard/budgets" ? "fill-indigo-100" : ""} />
          <span className="text-[10px] mt-1 font-medium">Budgets</span>
        </Link>
        <button
          onClick={toggleSidebar}
          className={`flex flex-col items-center justify-center w-16 h-full ${
            sidebarOpen ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Menu size={20} className={sidebarOpen ? "fill-indigo-100" : ""} />
          <span className="text-[10px] mt-1 font-medium">Menu</span>
        </button>
      </div>

      {/* Mobile Menu Bottom Sheet */}
      {sidebarOpen && isMobile && (
        <div className="md:hidden fixed inset-0 z-[60] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={closeSidebar}></div>
          <div className="bg-white w-full rounded-t-[2rem] p-6 pb-safe z-10 animate-slide-up max-h-[80vh] flex flex-col">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Menu</h2>
              <button onClick={closeSidebar} className="p-2 bg-gray-100 rounded-full text-gray-500">
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto overscroll-contain no-scrollbar flex-1 pb-4">
              <div className="grid grid-cols-4 gap-4 mb-6">
                {menuItems.filter(item => !['/dashboard', '/dashboard/transactions', '/dashboard/budgets'].includes(item.href)).map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeSidebar}
                    className="flex flex-col items-center p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm mb-2">
                       {item.icon}
                    </div>
                    <span className="text-xs font-medium text-gray-700 text-center">{item.label}</span>
                  </Link>
                ))}
              </div>

              <div className="space-y-2 mt-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Account</h3>
                {secondaryItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeSidebar}
                    className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-xl"
                  >
                    <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-gray-500">
                      {item.icon}
                    </span>
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                ))}
                <button
                  onClick={() => {
                    closeSidebar();
                    signOut();
                  }}
                  className="w-full flex items-center p-3 text-red-600 hover:bg-red-50 rounded-xl mt-2"
                >
                  <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                    <LogOut size={16} />
                  </span>
                  <span className="font-medium text-sm">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Quick Add Transaction Modal ──────────────────────── */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-[100] md:p-4">
          <div className="bg-white w-full md:max-w-md rounded-t-[2rem] md:rounded-2xl shadow-2xl animate-slide-up md:animate-none flex flex-col max-h-[90vh]">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-4 mb-2 md:hidden"></div>
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 pt-5 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                Quick Add Transaction
              </h2>
              <button
                onClick={() => {
                  setShowQuickAdd(false);
                  setQuickErrors({});
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain no-scrollbar pb-safe">
              <form onSubmit={handleQuickAdd} className="p-6 space-y-4">
              {/* Type Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl">
                {(
                  [
                    {
                      value: "expense",
                      label: "Expense",
                      Icon: ArrowUpCircle,
                      color: "text-red-600",
                    },
                    {
                      value: "income",
                      label: "Income",
                      Icon: ArrowDownCircle,
                      color: "text-green-600",
                    },
                    {
                      value: "transfer",
                      label: "Transfer",
                      Icon: ArrowLeftRight,
                      color: "text-blue-600",
                    },
                  ] as const
                ).map(({ value, label, Icon, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setQuickType(value);
                      setQuickErrors({});
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-sm font-medium transition-all ${
                      quickType === value
                        ? "bg-white shadow text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon
                      size={14}
                      className={quickType === value ? color : ""}
                    />
                    {label}
                  </button>
                ))}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  placeholder="e.g. Grocery shopping"
                  className={`w-full px-3 py-2.5 border rounded-xl text-base md:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    quickErrors.description
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  }`}
                />
                {quickErrors.description && (
                  <p className="mt-1 text-xs text-red-600">
                    {quickErrors.description[0]}
                  </p>
                )}
              </div>

              {/* Amount + Date row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2.5 border rounded-xl text-base md:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      quickErrors.amount
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                  />
                  {quickErrors.amount && (
                    <p className="mt-1 text-xs text-red-600">
                      {quickErrors.amount[0]}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className={`w-full px-3 py-2.5 border rounded-xl text-base md:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      quickErrors.date
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                  />
                  {quickErrors.date && (
                    <p className="mt-1 text-xs text-red-600">
                      {quickErrors.date[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Category (not for transfer) */}
              {quickType !== "transfer" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    className={`w-full px-3 py-2.5 border rounded-xl text-base md:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      quickErrors.category
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">Select category</option>
                    {categoryNames.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {quickErrors.category && (
                    <p className="mt-1 text-xs text-red-600">
                      {quickErrors.category[0]}
                    </p>
                  )}
                </div>
              )}

              {/* From Account (expense / transfer) */}
              {(quickType === "expense" || quickType === "transfer") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {quickType === "transfer" ? "From Account" : "From Account"}
                  </label>
                  <select
                    name="fromAccountId"
                    className={`w-full px-3 py-2.5 border rounded-xl text-base md:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      quickErrors.fromAccountId
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">Select account</option>
                    {accounts.map((acc) => (
                      <option key={acc._id} value={acc._id}>
                        {acc.name} — ₹{acc.balance?.toLocaleString()}
                      </option>
                    ))}
                  </select>
                  {quickErrors.fromAccountId && (
                    <p className="mt-1 text-xs text-red-600">
                      {quickErrors.fromAccountId[0]}
                    </p>
                  )}
                </div>
              )}

              {/* To Account (income / transfer) */}
              {(quickType === "income" || quickType === "transfer") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Account
                  </label>
                  <select
                    name="toAccountId"
                    className={`w-full px-3 py-2.5 border rounded-xl text-base md:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      quickErrors.toAccountId
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">Select account</option>
                    {accounts.map((acc) => (
                      <option key={acc._id} value={acc._id}>
                        {acc.name} — ₹{acc.balance?.toLocaleString()}
                      </option>
                    ))}
                  </select>
                  {quickErrors.toAccountId && (
                    <p className="mt-1 text-xs text-red-600">
                      {quickErrors.toAccountId[0]}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickAdd(false);
                    setQuickErrors({});
                  }}
                  className="flex-1 px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addTransaction.isPending}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-white rounded-xl font-medium transition-colors disabled:opacity-60 ${
                    quickType === "expense"
                      ? "bg-red-500 hover:bg-red-600"
                      : quickType === "income"
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  {addTransaction.isPending && (
                    <Loader2 size={15} className="animate-spin" />
                  )}
                  Add {quickType.charAt(0).toUpperCase() + quickType.slice(1)}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
