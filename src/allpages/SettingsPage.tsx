// allpages/SettingsPage.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { signOut } from "next-auth/react";
import {
  Globe,
  Bell,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Save,
  Languages,
  Coins,
  Download,
  Trash2,
  Database,
  X,
} from "lucide-react";
import { useProfile } from "@/hooks/profile/useProfile";
import { useUpdateProfile } from "@/hooks/profile/useUpdateProfile";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToastStore } from "@/store/useToastStore";
import {
  currencies,
  languages,
  type UpdateProfileInput,
} from "@/validations/profile";

// ─── Skeleton ────────────────────────────────────────────────────────
function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 bg-gray-200 rounded w-40 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-72" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export default function SettingsPage() {
  const { data: profile, isLoading, isError, error, refetch } = useProfile();
  const updateMutation = useUpdateProfile();
  const pushNotif = usePushNotifications();
  const showToast = useToastStore((s) => s.showToast);

  // Local draft for currency + language so user can change both then Save once.
  const [currency, setCurrency] = useState<UpdateProfileInput["currency"]>();
  const [lang, setLang] = useState<UpdateProfileInput["lang"]>();

  // Data & privacy
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/account/export");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `money-nest-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast("Your data was exported", "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Export failed",
        "error",
      );
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (profile) {
      setCurrency(profile.currency as UpdateProfileInput["currency"]);
      setLang(profile.lang as UpdateProfileInput["lang"]);
    }
  }, [profile]);

  const prefsDirty =
    !!profile &&
    (currency !== profile.currency || lang !== profile.lang);

  const savePrefs = async () => {
    if (!prefsDirty) return;
    try {
      await updateMutation.mutateAsync({ currency, lang });
    } catch {
      // toast handled in mutation
    }
  };

  // Auto-save toggle (used for 2FA)
  const handleToggle = async (
    field: "twoFactorAuth" | "notifications",
    value: boolean,
  ) => {
    try {
      await updateMutation.mutateAsync({ [field]: value });
    } catch {
      // toast handled in mutation
    }
  };

  if (isLoading) return <SettingsSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Failed to load settings
        </h2>
        <p className="text-gray-500 mb-4">
          {(error as Error)?.message || "Something went wrong"}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">
          Customize how Money Nest works for you
        </p>
      </div>

      {/* ── Preferences Card ──────────────────────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Globe className="text-indigo-600" size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Preferences
              </h2>
              <p className="text-sm text-gray-500">Display & regional</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Currency */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <Coins size={14} className="text-gray-500" />
              Currency
            </label>
            <select
              value={currency || "INR"}
              onChange={(e) =>
                setCurrency(e.target.value as UpdateProfileInput["currency"])
              }
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {currencies.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Used to display all transaction amounts
            </p>
          </div>

          {/* Language */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <Languages size={14} className="text-gray-500" />
              Language
            </label>
            <select
              value={lang || "en"}
              onChange={(e) =>
                setLang(e.target.value as UpdateProfileInput["lang"])
              }
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {languages.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Interface language across the app
            </p>
          </div>
        </div>

        {prefsDirty && (
          <div className="flex flex-col sm:flex-row gap-2 justify-end mt-5">
            <button
              onClick={() => {
                setCurrency(profile?.currency as UpdateProfileInput["currency"]);
                setLang(profile?.lang as UpdateProfileInput["lang"]);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              onClick={savePrefs}
              disabled={updateMutation.isPending}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-60"
            >
              {updateMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Save changes
            </button>
          </div>
        )}
      </section>

      {/* ── Notifications Card ────────────────────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-amber-100 p-2 rounded-lg">
            <Bell className="text-amber-600" size={18} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Notifications
            </h2>
            <p className="text-sm text-gray-500">
              Stay on top of budgets & goals
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-start gap-3 min-w-0">
            <Bell className="text-gray-500 mt-0.5 shrink-0" size={18} />
            <div className="min-w-0">
              <p className="font-medium text-gray-900">Push Notifications</p>
              <p className="text-sm text-gray-600">
                {!pushNotif.isSupported
                  ? "Not supported in this browser"
                  : pushNotif.permissionState === "denied"
                    ? "Blocked — enable in browser site settings"
                    : pushNotif.subscription
                      ? "Enabled on this device"
                      : "Receive budget alerts & goal updates"}
              </p>
            </div>
          </div>
          {pushNotif.isSupported &&
            pushNotif.permissionState !== "denied" && (
              <button
                onClick={async () => {
                  if (pushNotif.subscription) {
                    await pushNotif.unsubscribe();
                  } else {
                    const ok = await pushNotif.subscribe();
                    if (ok) {
                      await pushNotif.sendTestNotification(
                        "Welcome to Money Nest! 🎉",
                        "Push notifications are now enabled.",
                      );
                    }
                  }
                }}
                disabled={pushNotif.isLoading}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-60 ${
                  pushNotif.subscription
                    ? "text-red-600 bg-red-50 hover:bg-red-100"
                    : "text-white bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {pushNotif.isLoading && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                {pushNotif.subscription ? "Disable" : "Enable"}
              </button>
            )}
        </div>

        {pushNotif.subscription && (
          <button
            onClick={() =>
              pushNotif.sendTestNotification(
                "🔔 Test Notification",
                "Push notifications are working on Money Nest.",
              )
            }
            className="w-full mt-3 py-2 text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-medium"
          >
            Send test notification
          </button>
        )}
      </section>

      {/* ── Security Card ─────────────────────────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-green-100 p-2 rounded-lg">
            <ShieldCheck className="text-green-600" size={18} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Security</h2>
            <p className="text-sm text-gray-500">
              Add extra layers to protect your account
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-start gap-3 min-w-0">
            <ShieldCheck
              className="text-gray-500 mt-0.5 shrink-0"
              size={18}
            />
            <div className="min-w-0">
              <p className="font-medium text-gray-900">
                Two-Factor Authentication
              </p>
              <p className="text-sm text-gray-600">
                {profile?.twoFactorAuth
                  ? "Currently enabled — required at sign-in"
                  : "Require a code on sign-in for extra safety"}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={!!profile?.twoFactorAuth}
              onChange={(e) => handleToggle("twoFactorAuth", e.target.checked)}
              className="sr-only peer"
            />
            <div
              className={`w-11 h-6 ${
                profile?.twoFactorAuth ? "bg-green-600" : "bg-gray-300"
              } peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}
            />
          </label>
        </div>
      </section>

      {/* ── Data & Privacy ──────────────────────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-slate-100 p-2 rounded-lg">
            <Database className="text-slate-600" size={18} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Data &amp; Privacy
            </h2>
            <p className="text-sm text-gray-500">
              Export everything or permanently delete your account
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Export */}
          <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-start gap-3 min-w-0">
              <Download className="text-gray-500 mt-0.5 shrink-0" size={18} />
              <div className="min-w-0">
                <p className="font-medium text-gray-900">Export My Data</p>
                <p className="text-sm text-gray-600">
                  Download a JSON file with everything: profile, accounts,
                  transactions, budgets, goals, holdings.
                </p>
              </div>
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg disabled:opacity-60"
            >
              {isExporting && <Loader2 size={14} className="animate-spin" />}
              Export
            </button>
          </div>

          {/* Delete */}
          <div className="flex items-center justify-between gap-4 p-4 bg-red-50 border border-red-100 rounded-xl">
            <div className="flex items-start gap-3 min-w-0">
              <Trash2 className="text-red-500 mt-0.5 shrink-0" size={18} />
              <div className="min-w-0">
                <p className="font-medium text-red-900">Delete My Account</p>
                <p className="text-sm text-red-700/90">
                  Permanently erase your account and all data. This cannot be
                  undone.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
            >
              Delete
            </button>
          </div>
        </div>
      </section>

      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          onDeleted={async () => {
            // After server wipes the data, sign the user out and redirect
            await signOut({ callbackUrl: "/" });
          }}
        />
      )}
    </div>
  );
}

// ─── Delete Account Modal ────────────────────────────────────────────
function DeleteAccountModal({
  onClose,
  onDeleted,
}: {
  onClose: () => void;
  onDeleted: () => void | Promise<void>;
}) {
  const [confirm, setConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const showToast = useToastStore((s) => s.showToast);

  const handleDelete = async () => {
    if (confirm !== "DELETE") {
      setErrorMsg("Type DELETE to confirm");
      return;
    }
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "DELETE" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Delete failed");
      }
      showToast("Account deleted", "success");
      await onDeleted();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Delete failed");
      setIsDeleting(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-[200] md:p-4">
      <div className="bg-white w-full md:max-w-md rounded-t-[2rem] md:rounded-2xl shadow-2xl animate-slide-up md:animate-none flex flex-col max-h-[90vh]">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-4 mb-2 md:hidden" />
        <div className="flex justify-between items-center px-6 pt-2 md:pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-red-700">Delete Account</h2>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
            <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-800">
              This will <b>permanently</b> delete your profile, accounts,
              transactions, budgets, goals, holdings and notifications.{" "}
              <b>It cannot be undone.</b>
            </p>
          </div>

          <p className="text-sm text-gray-600">
            Consider exporting your data first if you might want it back.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type <span className="font-mono text-red-700">DELETE</span> to
              confirm
            </label>
            <input
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setErrorMsg(null);
              }}
              className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                errorMsg
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300"
              }`}
              placeholder="DELETE"
              autoFocus
            />
            {errorMsg && (
              <p className="mt-1 text-xs text-red-600">{errorMsg}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting || confirm !== "DELETE"}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-white bg-red-600 rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting && <Loader2 size={14} className="animate-spin" />}
              Delete forever
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
