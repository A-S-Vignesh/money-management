// app/dashboard/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useProfileStore } from "@/store/useProfileStore";
import Image from "next/image";
import {
  User,
  Edit,
  Save,
  X,
  Lock,
  Mail,
  Phone,
  MapPin,
  Calendar as CalendarIcon,
  ShieldCheck,
  CreditCard,
  Bell,
  Globe,
} from "lucide-react";
import IProfile from "@/types/profile";

export default function ProfilePage() {
  const { profile, updateProfile } = useProfileStore();
  const [editMode, setEditMode] = useState<boolean>(false);
  const [tempData, setTempData] = useState<IProfile>(
    profile ?? {
      _id: "",
      name: "",
      email: "",
      image: "",
      phoneNo: "",
      dob: new Date(),
      currency: "USD",
      lang: "en",
      notifications: false,
      twoFactorAuth: false,
    }
  );
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  type PasswordData = {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync tempData with profile
  useEffect(() => {
    if (profile) {
      setTempData({ ...profile });
    }
  }, [profile]);

  console.log("Profile Data:", profile);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setTempData((prev: IProfile) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateProfile(tempData); // Ensure `notifications` is in tempData
      setEditMode(false);
    } catch (err) {
      console.error("Failed to update profile", err);
    }
    setIsLoading(false);
  };

  const handleCancel = () => {
    setTempData({ ...profile });
    setEditMode(false);
  };

  const handlePasswordChange = (e: React.FormEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate password change
    setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsLoading(false);
      alert("Password updated successfully!");
    }, 1000);
  };

  console.log("Profile", profile);

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

        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Edit size={16} />
            <span>Edit Profile</span>
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <X size={16} />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-75"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-t-2 border-white border-solid rounded-full animate-spin"></div>
              ) : (
                <Save size={16} />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> */}
      <div className="grid grid-cols-1">
        {/* Profile Details */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <div className="relative">
                {tempData.image ? (
                  <Image
                    src={tempData.image}
                    alt="Profile"
                    width={128}
                    height={128}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow"
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={tempData.name || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter your name"
                    />
                  </div>

                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={tempData.bio}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Tell us about yourself"
                    ></textarea>
                  </div> */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          name="email"
                          value={tempData.email}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter your email"
                          disabled
                        />
                      </div>
                    </div>

                    {/* <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <Phone size={16} />
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          value={tempData.phone}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div> */}
                  </div>

                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-4 text-gray-400">
                        <MapPin size={16} />
                      </div>
                      <textarea
                        name="address"
                        value={tempData.address}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter your address"
                      ></textarea>
                    </div>
                  </div> */}

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
                        name="dateOfBirth"
                        value={
                          tempData?.dob
                            ? new Date(tempData.dob).toISOString().split("T")[0]
                            : ""
                        }
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {profile?.name || "User Name"}
                    </h2>
                    {/* <p className="text-gray-600 mt-1">{profile?.bio}</p> */}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start">
                      <Mail
                        className="text-gray-500 mr-3 flex-shrink-0"
                        size={18}
                      />
                      <div>
                        <p className="text-sm text-gray-600">Email Address</p>
                        <p className="font-medium">{profile?.email}</p>
                      </div>
                    </div>

                    {/* <div className="flex items-start">
                      <Phone
                        className="text-gray-500 mr-3 flex-shrink-0"
                        size={18}
                      />
                      <div>
                        <p className="text-sm text-gray-600">Phone Number</p>
                        <p className="font-medium">{profile?.phone}</p>
                      </div>
                    </div> */}
                  </div>

                  {/* <div className="flex items-start">
                    <MapPin
                      className="text-gray-500 mr-3 flex-shrink-0 mt-1"
                      size={18}
                    />
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-medium">{profile?.address}</p>
                    </div>
                  </div> */}

                  <div className="flex items-start">
                    <CalendarIcon
                      className="text-gray-500 mr-3 flex-shrink-0"
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
                      className="text-gray-500 mr-3 flex-shrink-0"
                      size={18}
                    />
                    <div>
                      <p className="text-sm text-gray-600">Member Since</p>
                      {/* <p className="font-medium">
                        {new Date(profile?.createdAt).toLocaleDateString(
                          "en-IN",
                          {
                            year: "numeric",
                            month: "long",
                          }
                        )}
                      </p> */}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account Settings */}
        {/* <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Account Settings
          </h3>

          <div className="space-y-4">
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
              <div className="font-medium">{profile?.currency}</div>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Globe className="text-gray-600 mr-3" size={18} />
                <div>
                  <p className="font-medium">Language</p>
                  <p className="text-sm text-gray-600">Interface language</p>
                </div>
              </div>
              <div className="font-medium">{profile?.language}</div>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Bell className="text-gray-600 mr-3" size={18} />
                <div>
                  <p className="font-medium">Notifications</p>
                  <p className="text-sm text-gray-600">
                    Receive app notifications
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="notifications"
                  checked={!!tempData.notifications} // ✅ Ensure it's always true or false
                  onChange={handleInputChange}
                  className="sr-only peer"
                  disabled={!editMode}
                />
                <div
                  className={`w-11 h-6 ${
                    tempData.notificationEnabled
                      ? "bg-indigo-600"
                      : "bg-gray-300"
                  } peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}
                ></div>
              </label>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <ShieldCheck className="text-gray-600 mr-3" size={18} />
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600">
                    Extra layer of security
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="twoFactorEnabled"
                  checked={tempData.twoFactorEnabled}
                  onChange={handleInputChange}
                  className="sr-only peer"
                  disabled={!editMode}
                />
                <div
                  className={`w-11 h-6 ${
                    tempData.twoFactorEnabled ? "bg-green-600" : "bg-gray-300"
                  } peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}
                ></div>
              </label>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              <Lock size={16} />
              <span>Change Password</span>
            </button>
          </div>
        </div> */}
      </div>

      {/* Security Card */}
      {/* <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
              Last changed: 3 months ago
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
              {profile?.twoFactorEnabled
                ? "Currently enabled"
                : "Add extra security to your account"}
            </p>
            <button className="text-sm text-indigo-600 font-medium hover:text-indigo-800">
              {profile?.twoFactorEnabled ? "Manage" : "Enable"}
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="bg-amber-100 p-2 rounded-lg mr-3">
                <CreditCard className="text-amber-600" size={20} />
              </div>
              <h4 className="font-medium">Connected Devices</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">2 active sessions</p>
            <button className="text-sm text-indigo-600 font-medium hover:text-indigo-800">
              View Sessions
            </button>
          </div>
        </div>
      </div> */}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Change Password</h2>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handlePasswordSubmit}>
                <div className="space-y-4">
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
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Confirm new password"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-75"
                  >
                    {isLoading ? "Updating..." : "Update Password"}
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
