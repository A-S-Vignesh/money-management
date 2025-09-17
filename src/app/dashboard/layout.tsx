"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useRef, use } from "react";
import { useSession, signOut } from "next-auth/react";
import { useToastStore } from "@/store/useToastStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useProfileStore } from "@/store/useProfileStore";
import { useAccountStore } from "@/store/useAccountStore";
import { useBudgetStore } from "@/store/useBudgetStore";
import { useGoalStore } from "@/store/useGoalStore";
import Toast from "@/components/Toast";
import {
  Home,
  CreditCard,
  List,
  PieChart,
  Settings,
  Bell,
  User,
  BarChart2,
  DollarSign,
  TrendingUp,
  Plus,
  HelpCircle,
  LogOut,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
  Mail,
  MessageSquare,
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

// Notification data
const notifications = [
  {
    id: 1,
    title: "Payment Received",
    description: "Your salary has been deposited",
    time: "2 hours ago",
    read: false,
  },
  {
    id: 2,
    title: "New Message",
    description: "You have a new message from Alex",
    time: "5 hours ago",
    read: true,
  },
  {
    id: 3,
    title: "Account Alert",
    description: "Unusual login activity detected",
    time: "1 day ago",
    read: false,
  },
];

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data: session } = useSession();

  const { toasts } = useToastStore();
  const { fetchTransactions } = useTransactionStore();
  const { fetchAccounts } = useAccountStore();
  const { fetchProfile } = useProfileStore();
  const { fetchBudgets } = useBudgetStore();
  const { fetchGoals } = useGoalStore();

  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
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

  useEffect(() => {
    fetchTransactions();
    fetchAccounts();
    fetchProfile();
    fetchBudgets();
    fetchGoals();
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleCollapse = () => setCollapsed(!collapsed);
  const toggleNotif = () => setIsNotifOpen(!isNotifOpen);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-50 top-0 h-full md:h-auto left-0 overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 ${collapsed ? "md:w-20" : "md:w-64"}`}
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
        <header className="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between">
          <div className="flex items-center">
            <button
              className="md:hidden mr-4 text-gray-500"
              onClick={toggleSidebar}
            >
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {menuItems.find((item) => item.href === pathname)?.label ||
                  secondaryItems.find((item) => item.href === pathname)?.label ||
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
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs h-4 w-4 flex items-center justify-center rounded-full">
                  3
                </span>
              </button>

              {/* Notification Dropdown Menu */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900">
                        Notifications
                      </h3>
                      <button className="text-xs text-indigo-600 hover:text-indigo-800">
                        Mark all as read
                      </button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                          !notification.read ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-0.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                              {notification.title.includes("Message") ? (
                                <MessageSquare
                                  size={16}
                                  className="text-indigo-600"
                                />
                              ) : (
                                <Mail size={16} className="text-indigo-600" />
                              )}
                            </div>
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {notification.description}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {notification.time}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="flex-shrink-0 ml-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 text-center border-t border-gray-100">
                    <Link
                      href="/dashboard/notifications"
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
          {children}
          {/* Toast Notifications */}
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() =>
                useToastStore.setState((state) => ({
                  toasts: state.toasts.filter((t) => t.id !== toast.id),
                }))
              }
            />
          ))}
        </div>
        <footer className="bg-white border-t border-gray-200 py-4 px-6 text-center text-sm text-gray-600">
          &copy; {new Date().getFullYear()} Money Manager. All rights reserved.
        </footer>
      </main>
    </div>
  );
}
