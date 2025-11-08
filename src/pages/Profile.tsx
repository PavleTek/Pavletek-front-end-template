import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/authService";
import type { UpdateUserRequest } from "../types";

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    name: "",
    lastName: "",
    chileanRutNumber: "",
    color: "#3285a8",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        name: user.name || "",
        lastName: user.lastName || "",
        chileanRutNumber: user.chileanRutNumber || "",
        color: user.color || "#3285a8",
        password: "",
        confirmPassword: "",
      });
    }
  }, [user]);

  const getInitials = (name?: string, lastName?: string): string => {
    const firstInitial = name?.charAt(0)?.toUpperCase() || "";
    const lastInitial = lastName?.charAt(0)?.toUpperCase() || "";
    return firstInitial + lastInitial || "U";
  };

  const handleEdit = () => {
    setIsEditMode(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setIsEditMode(false);
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        name: user.name || "",
        lastName: user.lastName || "",
        chileanRutNumber: user.chileanRutNumber || "",
        color: user.color || "#3285a8",
        password: "",
        confirmPassword: "",
      });
    }
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setError(null);
      setLoading(true);

      // Update basic user info including color (using non-admin endpoint)
      const updateData: UpdateUserRequest = {
        username: formData.username,
        email: formData.email,
        name: formData.name,
        lastName: formData.lastName,
        chileanRutNumber: formData.chileanRutNumber,
        color: formData.color,
      };
      await authService.updateProfile(updateData);

      // Update password if provided (using non-admin endpoint)
      if (formData.password) {
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        await authService.updatePassword(formData.password);
      }

      // Update the auth context with the new user data
      await updateUser();

      setSuccess("Profile updated successfully");
      setIsEditMode(false);
      setFormData({
        ...formData,
        password: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const userColor = formData.color || "#3285a8";
  const fullName = `${formData.name || ""} ${formData.lastName || ""}`.trim() || "N/A";

  return (
    <div>
      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">{error}</div>}
      {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-700">{success}</div>}

      <div className="px-4 sm:px-0">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base/7 font-semibold text-gray-900">Profile Information</h3>
            <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">Personal details and account settings.</p>
          </div>
          {!isEditMode && (
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 cursor-pointer"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-gray-100">
        <dl className="divide-y divide-gray-100">
          {/* Avatar Color */}
          <div className="bg-gray-50 px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-3">
            <dt className="text-sm/6 font-medium text-gray-900">Avatar</dt>
            <dd className="mt-1 sm:col-span-2 sm:mt-0">
              <div className="flex items-center gap-x-4">
                <div
                  className="size-16 flex-none rounded-full flex items-center justify-center text-white font-semibold text-lg"
                  style={{ backgroundColor: userColor }}
                >
                  {getInitials(formData.name, formData.lastName)}
                </div>
                {isEditMode ? (
                  <div className="flex items-center gap-x-3">
                    <input
                      id="color"
                      name="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                    />
                    <span className="text-sm/6 text-gray-500">Click to change color</span>
                  </div>
                ) : null}
              </div>
            </dd>
          </div>

          {/* Full Name */}
          <div className="bg-white px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-3">
            <dt className="text-sm/6 font-medium text-gray-900">Full name</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {isEditMode ? (
                <div className="space-y-3">
                  <input
                    id="first-name"
                    name="first-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="First name"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-600 sm:text-sm/6"
                  />
                  <input
                    id="last-name"
                    name="last-name"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Last name"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-600 sm:text-sm/6"
                  />
                </div>
              ) : (
                fullName
              )}
            </dd>
          </div>

          {/* Username */}
          <div className="bg-gray-50 px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-3">
            <dt className="text-sm/6 font-medium text-gray-900">Username</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {isEditMode ? (
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-600 sm:text-sm/6"
                />
              ) : (
                formData.username
              )}
            </dd>
          </div>

          {/* Email */}
          <div className="bg-white px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-3">
            <dt className="text-sm/6 font-medium text-gray-900">Email address</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {isEditMode ? (
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-600 sm:text-sm/6"
                />
              ) : (
                formData.email
              )}
            </dd>
          </div>

          {/* Chilean RUT Number */}
          <div className="bg-gray-50 px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-3">
            <dt className="text-sm/6 font-medium text-gray-900">Chilean RUT Number</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {isEditMode ? (
                <input
                  id="rut"
                  name="rut"
                  type="text"
                  value={formData.chileanRutNumber}
                  onChange={(e) => setFormData({ ...formData, chileanRutNumber: e.target.value })}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-600 sm:text-sm/6"
                />
              ) : (
                formData.chileanRutNumber || "N/A"
              )}
            </dd>
          </div>

          {/* Password Section - Only in Edit Mode */}
          {isEditMode && (
            <>
              <div className="bg-white px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-3">
                <dt className="text-sm/6 font-medium text-gray-900">New Password</dt>
                <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Leave blank to keep current"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-600 sm:text-sm/6"
                  />
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-3">
                <dt className="text-sm/6 font-medium text-gray-900">Confirm Password</dt>
                <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-600 sm:text-sm/6"
                  />
                </dd>
              </div>
            </>
          )}

          {/* Action Buttons - Only in Edit Mode */}
          {isEditMode && (
            <div className="bg-white px-4 py-6 sm:px-3">
              <div className="flex justify-end gap-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="inline-flex justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
};

export default Profile;

