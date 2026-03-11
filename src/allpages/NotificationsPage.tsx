"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Trash2,
  PieChart,
  DollarSign,
  CreditCard,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useNotifications } from "@/hooks/notifications/useNotifications";
import { useMarkAsRead } from "@/hooks/notifications/useMarkAsRead";
import { useMarkAllAsRead } from "@/hooks/notifications/useMarkAllAsRead";
import { useDeleteNotification } from "@/hooks/notifications/useDeleteNotification";

const typeFilters = [
  { value: "all", label: "All", icon: Bell },
  { value: "budget", label: "Budget", icon: PieChart },
  { value: "goal", label: "Goal", icon: DollarSign },
  { value: "transaction", label: "Transaction", icon: CreditCard },
  { value: "system", label: "System", icon: Bell },
] as const;

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function NotificationSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse"
        >
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-48" />
              <div className="h-3 bg-gray-100 rounded w-72" />
              <div className="h-3 bg-gray-100 rounded w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("all");

  const { data, isLoading } = useNotifications({
    page,
    limit: 15,
    type: typeFilter,
  });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications: Notification[] = data?.data ?? [];
  const pagination = data?.pagination;
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-600 mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up! No unread notifications."}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-60"
          >
            {markAllAsRead.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCheck size={16} />
            )}
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {typeFilters.map((filter) => {
          const Icon = filter.icon;
          return (
            <button
              key={filter.value}
              onClick={() => {
                setTypeFilter(filter.value);
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors whitespace-nowrap ${
                typeFilter === filter.value
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Icon size={14} />
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Notification List */}
      {isLoading ? (
        <NotificationSkeleton />
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            {typeFilter !== "all" ? (
              <Filter size={28} className="text-gray-400" />
            ) : (
              <Bell size={28} className="text-gray-400" />
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {typeFilter !== "all"
              ? `No ${typeFilter} notifications`
              : "No notifications yet"}
          </h3>
          <p className="text-sm text-gray-500">
            {typeFilter !== "all"
              ? "Try changing the filter to see other notifications."
              : "When something important happens, you'll see it here."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`bg-white rounded-xl border transition-all group ${
                !n.isRead
                  ? "border-indigo-200 bg-indigo-50/30 shadow-sm"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <div className="p-4 flex gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
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
                    <PieChart size={18} className="text-orange-600" />
                  ) : n.type === "goal" ? (
                    <DollarSign size={18} className="text-green-600" />
                  ) : n.type === "transaction" ? (
                    <CreditCard size={18} className="text-blue-600" />
                  ) : (
                    <Bell size={18} className="text-gray-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm ${!n.isRead ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}
                        >
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      {!n.isRead && (
                        <button
                          title="Mark as read"
                          onClick={() => markAsRead.mutate(n._id)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <CheckCheck size={16} />
                        </button>
                      )}
                      <button
                        title="Delete"
                        onClick={() => deleteNotification.mutate(n._id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3">
          <p className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages} ·{" "}
            {pagination.total} total
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={page >= pagination.totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
