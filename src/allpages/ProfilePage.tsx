// allpages/ProfilePage.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  Edit,
  Save,
  X,
  Lock,
  Mail,
  Calendar as CalendarIcon,
  ShieldCheck,
  CreditCard,
  Loader2,
  AlertCircle,
  Phone,
  Settings,
} from "lucide-react";
import { useProfile } from "@/hooks/profile/useProfile";
import { useUpdateProfile } from "@/hooks/profile/useUpdateProfile";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/validations/profile";

// ─── Form Errors ─────────────────────────────────────────────────────
interface FormErrors {
  name?: string[];
  phoneNo?: string[];
  dob?: string[];
}

// ─── Skeleton Loading ────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-72" />
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex gap-6">
          <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="flex-1 space-y-4">
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-40" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48" />
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
            </div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-36" />
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export default function ProfilePage() {
  const { data: profile, isLoading, isError, error, refetch } = useProfile();
  const updateMutation = useUpdateProfile();

  const [editMode, setEditMode] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [tempData, setTempData] = useState<UpdateProfileInput>({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    if (profile) {
      setTempData({
        name: profile.name || "",
        phoneNo: profile.phoneNo || "",
        dob: profile.dob
          ? new Date(profile.dob).toISOString().split("T")[0]
          : "",
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTempData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setFormErrors({});

    const result = updateProfileSchema.safeParse(tempData);
    if (!result.success) {
      setFormErrors(result.error.flatten().fieldErrors as FormErrors);
      return;
    }

    try {
      await updateMutation.mutateAsync(result.data);
      setEditMode(false);
      setFormErrors({});
    } catch {
      // toast handled by mutation
    }
  };

  const handleCancel = () => {
    if (profile) {
      setTempData({
        name: profile.name || "",
        phoneNo: profile.phoneNo || "",
        dob: profile.dob
          ? new Date(profile.dob).toISOString().split("T")[0]
          : "",
      });
    }
    setEditMode(false);
    setFormErrors({});
  };

  if (isLoading) return <ProfileSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Failed to load profile
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">Your personal information</p>
        </div>
        <Link
          href="/dashboard/settings"
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <Settings size={16} />
          App settings
        </Link>
      </div>

      {/* ── Profile Details Card ─────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 md:p-6">
        <div className="flex flex-col md:flex-row gap-5 md:gap-8 items-center md:items-start">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile?.image ? (
              <Image
                src={profile.image}
                alt="Profile"
                width={128}
                height={128}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-sm"
              />
            ) : (
              <div className="bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-full w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
                <User className="text-gray-400 dark:text-gray-500" size={40} />
              </div>
            )}
          </div>

          {/* Personal Information */}
          <div className="flex-1 w-full text-left mt-2 md:mt-0">
            {editMode ? (
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={tempData.name || ""}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      formErrors.name
                        ? "border-red-300 bg-red-50 dark:bg-red-950/30"
                        : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    }`}
                    placeholder="Enter your name"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                      {formErrors.name[0]}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email — read-only */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                        <Mail size={16} />
                      </div>
                      <input
                        type="email"
                        value={profile?.email || ""}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        disabled
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                        <Phone size={16} />
                      </div>
                      <input
                        type="tel"
                        name="phoneNo"
                        value={tempData.phoneNo || ""}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                          formErrors.phoneNo
                            ? "border-red-300 bg-red-50 dark:bg-red-950/30"
                            : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        }`}
                        placeholder="+91 9876543210"
                      />
                    </div>
                    {formErrors.phoneNo && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                        {formErrors.phoneNo[0]}
                      </p>
                    )}
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                      <CalendarIcon size={16} />
                    </div>
                    <input
                      type="date"
                      name="dob"
                      value={tempData.dob || ""}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.dob
                          ? "border-red-300 bg-red-50 dark:bg-red-950/30"
                          : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      }`}
                    />
                  </div>
                  {formErrors.dob && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                      {formErrors.dob[0]}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center md:text-left mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {profile?.name || "User Name"}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow
                    icon={<Mail size={18} />}
                    label="Email Address"
                    value={profile?.email || "—"}
                    truncate
                  />
                  {profile?.phoneNo && (
                    <InfoRow
                      icon={<Phone size={18} />}
                      label="Phone Number"
                      value={profile.phoneNo}
                    />
                  )}
                  <InfoRow
                    icon={<CalendarIcon size={18} />}
                    label="Date of Birth"
                    value={
                      profile?.dob
                        ? new Date(profile.dob).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "—"
                    }
                  />
                  <InfoRow
                    icon={<CalendarIcon size={18} />}
                    label="Member Since"
                    value={
                      profile?.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString(
                            "en-IN",
                            { year: "numeric", month: "long" },
                          )
                        : "—"
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5">
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors text-sm font-medium"
            >
              <Edit size={16} />
              Edit Profile
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleCancel}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
              >
                <X size={16} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-60 text-sm font-medium"
              >
                {updateMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Security Card ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 md:p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Security</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SecurityCard
            tone="indigo"
            icon={<ShieldCheck className="text-indigo-600 dark:text-indigo-300" size={20} />}
            title="Password"
            description="Keep your account secure"
            actionLabel="Change Password"
            onAction={() => setShowPasswordModal(true)}
          />
          <SecurityCard
            tone="green"
            icon={<ShieldCheck className="text-green-600 dark:text-green-300" size={20} />}
            title="Two-Factor Auth"
            description={
              profile?.twoFactorAuth
                ? "Currently enabled"
                : "Add extra security"
            }
            actionLabel={profile?.twoFactorAuth ? "Manage" : "Enable"}
            href="/dashboard/settings"
          />
          <SecurityCard
            tone="amber"
            icon={<CreditCard className="text-amber-600 dark:text-amber-300" size={20} />}
            title="Connected Devices"
            description="Active sessions"
            actionLabel="View Sessions"
          />
        </div>
      </div>

      {/* Mobile-only link to settings */}
      <Link
        href="/dashboard/settings"
        className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800"
      >
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
            <Settings className="text-gray-700 dark:text-gray-300" size={18} />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">App Settings</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Currency, language, notifications & 2FA
            </p>
          </div>
        </div>
        <span className="text-gray-400 dark:text-gray-500">›</span>
      </Link>

      {/* ── Change Password Modal ──────── */}
      {showPasswordModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-[200] md:p-4">
            <div className="bg-white dark:bg-gray-900 rounded-t-[2rem] md:rounded-2xl w-full max-w-md shadow-2xl animate-slide-up md:animate-none flex flex-col max-h-[90vh]">
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-4 mb-2 md:hidden"></div>

              <div className="flex justify-between items-center px-6 pt-2 md:pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Change Password
                </h2>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setShowPasswordModal(false);
                }}
                className="p-6 space-y-5 overflow-y-auto mb-6"
              >
                {[
                  { label: "Current Password", placeholder: "Enter current password" },
                  { label: "New Password", placeholder: "Enter new password" },
                  { label: "Confirm New Password", placeholder: "Confirm new password" },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {field.label}
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                        <Lock size={16} />
                      </div>
                      <input
                        type="password"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder={field.placeholder}
                        required
                      />
                    </div>
                  </div>
                ))}

                <div className="flex gap-3 pt-4 mt-6 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 px-4 py-3 md:py-2.5 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flex justify-center items-center px-4 py-3 md:py-2.5 bg-indigo-600 text-white text-sm rounded-xl font-medium hover:bg-indigo-700 cursor-pointer transition-colors"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  truncate,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-gray-500 dark:text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        <p
          className={`font-medium text-gray-900 dark:text-gray-100 ${
            truncate ? "truncate max-w-[220px] md:max-w-[260px]" : ""
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function SecurityCard({
  tone,
  icon,
  title,
  description,
  actionLabel,
  onAction,
  href,
}: {
  tone: "indigo" | "green" | "amber";
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
  href?: string;
}) {
  const toneBg =
    tone === "indigo"
      ? "bg-indigo-100 dark:bg-indigo-900/40"
      : tone === "green"
        ? "bg-green-100 dark:bg-green-900/40"
        : "bg-amber-100 dark:bg-amber-900/40";

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center mb-3">
        <div className={`${toneBg} p-2 rounded-lg mr-3`}>{icon}</div>
        <h4 className="font-medium text-gray-900 dark:text-gray-100">{title}</h4>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{description}</p>
      {href ? (
        <Link
          href={href}
          className="text-sm text-indigo-600 dark:text-indigo-300 font-medium hover:text-indigo-800"
        >
          {actionLabel}
        </Link>
      ) : (
        <button
          onClick={onAction}
          className="text-sm text-indigo-600 dark:text-indigo-300 font-medium hover:text-indigo-800"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
