// allpages/ProfilePage.tsx
"use client";

import { useState, useEffect } from "react";
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
  Bell,
  Globe,
  Loader2,
  AlertCircle,
  Phone,
} from "lucide-react";
import { useProfile } from "@/hooks/profile/useProfile";
import { useUpdateProfile } from "@/hooks/profile/useUpdateProfile";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  updateProfileSchema,
  currencies,
  languages,
  type UpdateProfileInput,
} from "@/validations/profile";

// ─── Form Errors ─────────────────────────────────────────────────────
interface FormErrors {
  name?: string[];
  phoneNo?: string[];
  dob?: string[];
  currency?: string[];
  lang?: string[];
  notifications?: string[];
  twoFactorAuth?: string[];
}

// ─── Skeleton Loading ────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 bg-gray-200 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-72" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex gap-6">
            <div className="w-32 h-32 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-4">
              <div className="h-7 bg-gray-200 rounded w-40" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="h-3 bg-gray-100 rounded w-20" />
                  <div className="h-5 bg-gray-200 rounded w-48" />
                </div>
                <div className="space-y-1">
                  <div className="h-3 bg-gray-100 rounded w-20" />
                  <div className="h-5 bg-gray-200 rounded w-32" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="h-3 bg-gray-100 rounded w-20" />
                <div className="h-5 bg-gray-200 rounded w-36" />
              </div>
            </div>
          </div>
        </div>

        {/* Settings Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="h-6 bg-gray-200 rounded w-36 mb-4" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export default function ProfilePage() {
  const { data: profile, isLoading, isError, error, refetch } = useProfile();
  const updateMutation = useUpdateProfile();
  const pushNotif = usePushNotifications();

  const [editMode, setEditMode] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [tempData, setTempData] = useState<UpdateProfileInput>({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Sync tempData with fetched profile
  useEffect(() => {
    if (profile) {
      setTempData({
        name: profile.name || "",
        phoneNo: profile.phoneNo || "",
        dob: profile.dob
          ? new Date(profile.dob).toISOString().split("T")[0]
          : "",
        currency: profile.currency as UpdateProfileInput["currency"],
        lang: profile.lang as UpdateProfileInput["lang"],
        notifications: !!profile.notifications,
        twoFactorAuth: !!profile.twoFactorAuth,
      });
    }
  }, [profile]);

  // ── Input Handler ──────────────────────
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const target = e.target;
    const { name, value } = target;
    const isCheckbox =
      target instanceof HTMLInputElement && target.type === "checkbox";

    setTempData((prev) => ({
      ...prev,
      [name]: isCheckbox ? (target as HTMLInputElement).checked : value,
    }));
  };

  // ── Save Handler ───────────────────────
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
      // Handled by mutation onError
    }
  };

  // ── Cancel Handler ─────────────────────
  const handleCancel = () => {
    if (profile) {
      setTempData({
        name: profile.name || "",
        phoneNo: profile.phoneNo || "",
        dob: profile.dob
          ? new Date(profile.dob).toISOString().split("T")[0]
          : "",
        currency: profile.currency as UpdateProfileInput["currency"],
        lang: profile.lang as UpdateProfileInput["lang"],
        notifications: !!profile.notifications,
        twoFactorAuth: !!profile.twoFactorAuth,
      });
    }
    setEditMode(false);
    setFormErrors({});
  };

  // ── Toggle Handler (auto-save) ─────────
  const handleToggle = async (
    field: "notifications" | "twoFactorAuth",
    value: boolean,
  ) => {
    setTempData((prev) => ({ ...prev, [field]: value }));
    try {
      await updateMutation.mutateAsync({ [field]: value });
    } catch {
      // Revert on error
      setTempData((prev) => ({ ...prev, [field]: !value }));
    }
  };

  // ── Loading State ──────────────────────
  if (isLoading) return <ProfileSkeleton />;

  // ── Error State ────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Failed to load profile
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600">
            Manage your personal and account information
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* ── Profile Details Card ───────── */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-start text-center md:text-left">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <div className="relative">
                {profile?.image ? (
                  <Image
                    src={profile.image}
                    alt="Profile"
                    width={128}
                    height={128}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow"
                  />
                ) : (
                  <div className="bg-gray-200 border-2 border-dashed rounded-full w-32 h-32 flex items-center justify-center">
                    <User className="text-gray-400" size={48} />
                  </div>
                )}
              </div>
            </div>

            {/* Personal Information */}
            <div className="flex-1">
              {editMode ? (
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={tempData.name || ""}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.name
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter your name"
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-xs text-red-600">
                        {formErrors.name[0]}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email (read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <Mail size={16} />
                        </div>
                        <input
                          type="email"
                          value={profile?.email || ""}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                          disabled
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <Phone size={16} />
                        </div>
                        <input
                          type="tel"
                          name="phoneNo"
                          value={tempData.phoneNo || ""}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                            formErrors.phoneNo
                              ? "border-red-300 bg-red-50"
                              : "border-gray-300"
                          }`}
                          placeholder="+91 9876543210"
                        />
                      </div>
                      {formErrors.phoneNo && (
                        <p className="mt-1 text-xs text-red-600">
                          {formErrors.phoneNo[0]}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <CalendarIcon size={16} />
                      </div>
                      <input
                        type="date"
                        name="dob"
                        value={tempData.dob || ""}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                          formErrors.dob
                            ? "border-red-300 bg-red-50"
                            : "border-gray-300"
                        }`}
                      />
                    </div>
                    {formErrors.dob && (
                      <p className="mt-1 text-xs text-red-600">
                        {formErrors.dob[0]}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Currency */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Currency
                      </label>
                      <select
                        name="currency"
                        value={tempData.currency || "INR"}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                          formErrors.currency
                            ? "border-red-300 bg-red-50"
                            : "border-gray-300"
                        }`}
                      >
                        {currencies.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      {formErrors.currency && (
                        <p className="mt-1 text-xs text-red-600">
                          {formErrors.currency[0]}
                        </p>
                      )}
                    </div>

                    {/* Language */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Language
                      </label>
                      <select
                        name="lang"
                        value={tempData.lang || "en"}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                          formErrors.lang
                            ? "border-red-300 bg-red-50"
                            : "border-gray-300"
                        }`}
                      >
                        {languages.map((l) => (
                          <option key={l.value} value={l.value}>
                            {l.label}
                          </option>
                        ))}
                      </select>
                      {formErrors.lang && (
                        <p className="mt-1 text-xs text-red-600">
                          {formErrors.lang[0]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // ── View Mode ─────────────────
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {profile?.name || "User Name"}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start">
                      <Mail
                        className="text-gray-500 mr-3 flex-shrink-0 mt-0.5"
                        size={18}
                      />
                      <div>
                        <p className="text-sm text-gray-600">Email Address</p>
                        <p className="font-medium">{profile?.email}</p>
                      </div>
                    </div>

                    {profile?.phoneNo && (
                      <div className="flex items-start">
                        <Phone
                          className="text-gray-500 mr-3 flex-shrink-0 mt-0.5"
                          size={18}
                        />
                        <div>
                          <p className="text-sm text-gray-600">Phone Number</p>
                          <p className="font-medium">{profile.phoneNo}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start">
                    <CalendarIcon
                      className="text-gray-500 mr-3 flex-shrink-0 mt-0.5"
                      size={18}
                    />
                    <div>
                      <p className="text-sm text-gray-600">Date of Birth</p>
                      <p className="font-medium">
                        {profile?.dob
                          ? new Date(profile.dob).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <CalendarIcon
                      className="text-gray-500 mr-3 flex-shrink-0 mt-0.5"
                      size={18}
                    />
                    <div>
                      <p className="text-sm text-gray-600">Member Since</p>
                      <p className="font-medium">
                        {profile?.createdAt
                          ? new Date(profile.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                year: "numeric",
                                month: "long",
                              },
                            )
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 md:p-0 md:mt-4">
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="w-full md:w-auto flex flex-1 items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors text-sm font-medium"
              >
                <Edit size={16} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleCancel}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium"
                >
                  <X size={16} />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-60 text-sm font-medium"
                >
                  {updateMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Account Settings Card ─────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Account Settings
          </h3>

          <div className="space-y-4">
            {/* Currency */}
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Globe className="text-gray-600 mr-3" size={18} />
                <div>
                  <p className="font-medium">Currency</p>
                  <p className="text-sm text-gray-600">
                    Display currency for transactions
                  </p>
                </div>
              </div>
              <div className="font-medium text-sm">
                {currencies
                  .find((c) => c.value === profile?.currency)
                  ?.label?.split(" — ")[0] || profile?.currency}
              </div>
            </div>

            {/* Language */}
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Globe className="text-gray-600 mr-3" size={18} />
                <div>
                  <p className="font-medium">Language</p>
                  <p className="text-sm text-gray-600">Interface language</p>
                </div>
              </div>
              <div className="font-medium text-sm">
                {languages.find((l) => l.value === profile?.lang)?.label ||
                  profile?.lang}
              </div>
            </div>

            {/* Push Notifications */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Bell className="text-gray-600 mr-3" size={18} />
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-gray-600">
                      {!pushNotif.isSupported
                        ? "Not supported in this browser"
                        : pushNotif.permissionState === "denied"
                          ? "Blocked — enable in browser settings"
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
                      className={`w-auto px-4 py-1.5 text-sm font-medium rounded-lg transition-colors shrink-0 ${
                        pushNotif.subscription
                          ? "text-red-600 bg-red-50 hover:bg-red-100"
                          : "text-white bg-indigo-600 hover:bg-indigo-700"
                      } disabled:opacity-60 flex items-center gap-1.5`}
                    >
                      {pushNotif.isLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : null}
                      {pushNotif.subscription ? "Disable" : "Enable"}
                    </button>
                  )}
              </div>
              {/* {pushNotif.subscription && (
                <button
                  onClick={() =>
                    pushNotif.sendTestNotification(
                      "🔔 Test Notification",
                      "Push notifications are working on Money Nest.",
                    )
                  }
                  className="w-full py-2 text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-medium"
                >
                  Send Test Notification
                </button>
              )} */}
            </div>

            {/* 2FA Toggle */}
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <ShieldCheck className="text-gray-600 mr-3" size={18} />
                <div>
                  <p className="font-medium">Two-Factor Auth</p>
                  <p className="text-sm text-gray-600">
                    Extra layer of security
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!tempData.twoFactorAuth}
                  onChange={(e) =>
                    handleToggle("twoFactorAuth", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div
                  className={`w-11 h-6 ${
                    tempData.twoFactorAuth ? "bg-green-600" : "bg-gray-300"
                  } peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}
                ></div>
              </label>
            </div>
          </div>

          {/* <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors text-sm font-medium"
            >
              <Lock size={16} />
              <span>Change Password</span>
            </button>
          </div> */}
        </div>
      </div>

      {/* Security Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Security</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                <ShieldCheck className="text-indigo-600" size={20} />
              </div>
              <h4 className="font-medium">Password</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Keep your account secure
            </p>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="text-sm text-indigo-600 font-medium hover:text-indigo-800"
            >
              Change Password
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="bg-green-100 p-2 rounded-lg mr-3">
                <ShieldCheck className="text-green-600" size={20} />
              </div>
              <h4 className="font-medium">Two-Factor Authentication</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {profile?.twoFactorAuth
                ? "Currently enabled"
                : "Add extra security to your account"}
            </p>
            <button className="text-sm text-indigo-600 font-medium hover:text-indigo-800">
              {profile?.twoFactorAuth ? "Manage" : "Enable"}
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="bg-amber-100 p-2 rounded-lg mr-3">
                <CreditCard className="text-amber-600" size={20} />
              </div>
              <h4 className="font-medium">Connected Devices</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">Active sessions</p>
            <button className="text-sm text-indigo-600 font-medium hover:text-indigo-800">
              View Sessions
            </button>
          </div>
        </div>
      </div>

      {/* ── Change Password Modal ──────── */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-[100] md:p-4">
          <div className="bg-white rounded-t-[2rem] md:rounded-2xl w-full max-w-md shadow-2xl animate-slide-up md:animate-none flex flex-col max-h-[90vh]">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-4 mb-2 md:hidden"></div>
            
            <div className="flex justify-between items-center px-6 pt-2 md:pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                Change Password
              </h2>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Password change not implemented for Google OAuth users
                setShowPasswordModal(false);
              }}
              className="p-6 space-y-5 overflow-y-auto mb-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter current password"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter new password"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 mt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-3 md:py-2.5 text-sm text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium cursor-pointer"
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
        </div>
      )}
    </div>
  );
}
