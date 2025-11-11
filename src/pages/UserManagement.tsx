import React, { useState, useEffect, useRef } from "react";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { XMarkIcon, KeyIcon } from "@heroicons/react/24/outline";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useAuth } from "../contexts/AuthContext";
import { userService } from "../services/userService";
import { roleService } from "../services/roleService";
import type { User, Role, UpdateUserRequest, CreateUserRequest } from "../types";
import SuccessBanner from "../components/SuccessBanner";
import ErrorBanner from "../components/ErrorBanner";
import ConfirmationDialog from "../components/ConfirmationDialog";

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reset2FADialogOpen, setReset2FADialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    name: "",
    lastName: "",
    chileanRutNumber: "",
    color: "#3285a8",
    password: "",
    confirmPassword: "",
    roleIds: [] as number[],
  });

  // Ref to store the form element
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Handle Ctrl+Enter keyboard shortcut for save/create
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Ctrl+Enter (or Cmd+Enter on Mac) is pressed
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        // Only trigger if dialog is open and in edit/create mode
        if (open && (isEditMode || isCreateMode)) {
          event.preventDefault();
          event.stopPropagation();
          // Trigger form submission which will call handleSave via onSubmit
          if (formRef.current) {
            formRef.current.requestSubmit();
          }
        }
      }
    };

    // Add event listener when dialog is open and in edit/create mode
    if (open && (isEditMode || isCreateMode)) {
      window.addEventListener("keydown", handleKeyDown);
    }

    // Cleanup event listener
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, isEditMode, isCreateMode]);

  useEffect(() => {
    if (selectedUser && !isEditMode && !isCreateMode) {
      setFormData({
        username: selectedUser.username || "",
        email: selectedUser.email || "",
        name: selectedUser.name || "",
        lastName: selectedUser.lastName || "",
        chileanRutNumber: selectedUser.chileanRutNumber || "",
        color: selectedUser.color || "#3285a8",
        password: "",
        confirmPassword: "",
        roleIds: roles.filter((r) => selectedUser.roles.includes(r.name)).map((r) => r.id),
      });
    }
  }, [selectedUser, isEditMode, isCreateMode, roles]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([userService.getAllUsers(), roleService.getAllRoles()]);
      setUsers(usersData.users);
      setRoles(rolesData.roles);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const openUserDialog = (user: User) => {
    setSelectedUser(user);
    setIsEditMode(false);
    setIsCreateMode(false);
    setOpen(true);
    setError(null);
    setSuccess(null);
  };

  const openCreateDialog = () => {
    setSelectedUser(null);
    setIsEditMode(true);
    setIsCreateMode(true);
    setFormData({
      username: "",
      email: "",
      name: "",
      lastName: "",
      chileanRutNumber: "",
      color: "#3285a8",
      password: "",
      confirmPassword: "",
      roleIds: [],
    });
    setOpen(true);
    setError(null);
    setSuccess(null);
  };

  const closeDialog = () => {
    setOpen(false);
    setSelectedUser(null);
    setIsEditMode(false);
    setIsCreateMode(false);
    // Don't clear page-level error/success states here - they should persist after dialog closes
  };

  const handleEdit = () => {
    setIsEditMode(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    if (isCreateMode) {
      closeDialog();
    } else {
      setIsEditMode(false);
      if (selectedUser) {
        setFormData({
          username: selectedUser.username || "",
          email: selectedUser.email || "",
          name: selectedUser.name || "",
          lastName: selectedUser.lastName || "",
          chileanRutNumber: selectedUser.chileanRutNumber || "",
          color: selectedUser.color || "#3285a8",
          password: "",
          confirmPassword: "",
          roleIds: roles.filter((r) => selectedUser.roles.includes(r.name)).map((r) => r.id),
        });
      }
      setError(null);
      setSuccess(null);
    }
  };

  const generatePassword = () => {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData({ ...formData, password });
  };

  const handleSave = async () => {
    try {
      setError(null);

      if (isCreateMode) {
        // Create new user
        if (!formData.password) {
          setError("Password is required");
          return;
        }

        const createData: CreateUserRequest = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          name: formData.name || undefined,
          lastName: formData.lastName || undefined,
          chileanRutNumber: formData.chileanRutNumber || undefined,
          roleIds: formData.roleIds.length > 0 ? formData.roleIds : undefined,
        };

        const newUser = await userService.createUser(createData);

        // Update color after creation if provided
        if (formData.color && formData.color !== "#3285a8") {
          await userService.updateUser(newUser.user.id, { color: formData.color });
        }

        setSuccess("User created successfully");
        await loadData();
        closeDialog();
      } else {
        // Update existing user
        if (!selectedUser) return;

        // Update basic user info including color
        const updateData: UpdateUserRequest = {
          username: formData.username,
          email: formData.email,
          name: formData.name,
          lastName: formData.lastName,
          chileanRutNumber: formData.chileanRutNumber,
          color: formData.color,
        };
        await userService.updateUser(selectedUser.id, updateData);

        // Update password if provided
        if (formData.password) {
          if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
          }
          await userService.changeUserPassword(selectedUser.id, formData.password);
        }

        // Update roles
        await userService.changeUserRoles(selectedUser.id, formData.roleIds);

        setSuccess("User updated successfully");
        setIsEditMode(false);
        await loadData();
        // Refresh selected user from updated list
        const updatedUsers = await userService.getAllUsers();
        const updatedUser = updatedUsers.users.find((u) => u.id === selectedUser.id);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || (isCreateMode ? "Failed to create user" : "Failed to update user"));
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      setError(null);
      await userService.deleteUser(selectedUser.id);
      setDeleteDialogOpen(false);
      closeDialog();
      await loadData();
      setSuccess("User deleted successfully");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete user");
      setDeleteDialogOpen(false);
    }
  };

  const handleForceReset2FA = async () => {
    if (!selectedUser) return;

    try {
      setError(null);
      await userService.forceResetUser2FA(selectedUser.id);
      setReset2FADialogOpen(false);
      await loadData();
      // Refresh selected user from updated list
      const updatedUsers = await userService.getAllUsers();
      const updatedUser = updatedUsers.users.find((u) => u.id === selectedUser.id);
      if (updatedUser) {
        setSelectedUser(updatedUser);
      }
      setSuccess("2FA has been reset for this user. They will need to set up 2FA again on their next login if system 2FA is enabled.");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to reset 2FA");
      setReset2FADialogOpen(false);
    }
  };

  const getInitials = (name?: string, lastName?: string): string => {
    const firstInitial = name?.charAt(0)?.toUpperCase() || "";
    const lastInitial = lastName?.charAt(0)?.toUpperCase() || "";
    return firstInitial + lastInitial || "U";
  };

  const formatLastLogin = (lastLogin?: string): { text: string; isRecentlyActive: boolean } => {
    if (!lastLogin) {
      return { text: "Never logged in", isRecentlyActive: false };
    }

    const lastLoginDate = new Date(lastLogin);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastLoginDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 15) {
      return { text: "Recently active", isRecentlyActive: true };
    }

    if (diffInMinutes < 60) {
      return { text: `${diffInMinutes}m ago`, isRecentlyActive: false };
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return { text: `${diffInHours}h ago`, isRecentlyActive: false };
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return { text: `${diffInDays}d ago`, isRecentlyActive: false };
    }

    return { text: lastLoginDate.toLocaleDateString(), isRecentlyActive: false };
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <button
          type="button"
          onClick={openCreateDialog}
          className="inline-flex items-center gap-x-2 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 cursor-pointer"
        >
          Create User
        </button>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}
      {success && (
        <div className="mb-4">
          <SuccessBanner message={success} onDismiss={() => setSuccess(null)} />
        </div>
      )}

      <ul role="list" className="divide-y divide-gray-100 overflow-hidden bg-white shadow-xs outline-1 outline-gray-900/5 sm:rounded-xl">
        {users.map((user) => {
          const { text: lastLoginText, isRecentlyActive } = formatLastLogin(user.lastLogin);
          const userColor = user.color || "#3285a8";

          return (
            <li key={user.id} className="relative py-5 hover:bg-gray-50">
              <div className="px-4 sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-4xl justify-between gap-x-6">
                  <div className="flex min-w-0 gap-x-4">
                    <div
                      className="size-12 flex-none rounded-full flex items-center justify-center text-white font-semibold text-sm"
                      style={{ backgroundColor: userColor }}
                    >
                      {getInitials(user.name, user.lastName)}
                    </div>
                    <div className="min-w-0 flex-auto">
                      <p className="text-sm/6 font-semibold text-gray-900">
                        {user.name} {user.lastName}
                      </p>
                      <p className="mt-1 flex text-xs/5 text-gray-500">{user.email}</p>
                      <p className="mt-1 text-xs text-gray-400">@{user.username}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-x-4">
                    <div className="hidden sm:flex sm:flex-col sm:items-end">
                      <div className="flex flex-wrap gap-1.5 justify-end mb-1">
                        {user.roles.map((role) => (
                          <span key={role} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                            {role}
                          </span>
                        ))}
                      </div>
                      {isRecentlyActive ? (
                        <div className="flex items-center gap-x-1.5">
                          <div className="flex-none rounded-full bg-emerald-500/20 p-1">
                            <div className="size-1.5 rounded-full bg-emerald-500" />
                          </div>
                          <p className="text-xs/5 text-gray-500">{lastLoginText}</p>
                        </div>
                      ) : (
                        <p className="text-xs/5 text-gray-500">{lastLoginText}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openUserDialog(user);
                      }}
                      className="cursor-pointer hover:text-gray-600"
                    >
                      <ChevronRightIcon aria-hidden={true} className="size-5 flex-none text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog open={open} onClose={closeDialog} className="relative z-50">
        <div className="fixed inset-0 bg-black/25" />

        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <DialogPanel
                transition
                className="pointer-events-auto w-screen max-w-md transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700"
              >
                <form
                  ref={formRef}
                  className="relative flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (isEditMode || isCreateMode) {
                      handleSave();
                    }
                  }}
                >
                  <div className="h-0 flex-1 overflow-y-auto">
                    <div className="bg-primary-700 px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <DialogTitle className="text-base font-semibold text-white">
                          {isCreateMode ? "Create New User" : selectedUser ? `${selectedUser.name} ${selectedUser.lastName}` : "User Details"}
                        </DialogTitle>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            onClick={closeDialog}
                            className="relative rounded-md text-primary-100 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white cursor-pointer"
                          >
                            <span className="absolute -inset-2.5" />
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon aria-hidden="true" className="size-6" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-primary-100">
                          {isCreateMode
                            ? "Fill in the information below to create a new user."
                            : isEditMode
                            ? "Edit user information below."
                            : "View and manage user information and settings."}
                        </p>
                      </div>
                    </div>

                    {(error || success) && (
                      <div className="px-4 sm:px-6 pt-4">
                        {error && <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>}
                        {success && <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">{success}</div>}
                      </div>
                    )}

                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        {(selectedUser || isCreateMode) && (
                          <>
                            {/* Profile Section */}
                            <div className="border-b border-gray-200">
                              <div className="px-4 py-5 sm:px-6">
                                <label htmlFor="username" className="block text-base font-semibold text-gray-900 mb-2">
                                  Username
                                </label>
                                <div>
                                  {isEditMode || isCreateMode ? (
                                    <input
                                      id="username"
                                      name="username"
                                      type="text"
                                      value={formData.username}
                                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                      className="block w-full rounded-md bg-white px-3 py-1.5 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-600"
                                    />
                                  ) : (
                                    <p className="text-sm text-gray-900">{formData.username}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="border-b border-gray-200 bg-gray-50/50">
                              <div className="px-4 py-5 sm:px-6">
                                <label htmlFor="email" className="block text-base font-semibold text-gray-900 mb-2">
                                  Email
                                </label>
                                <div>
                                  {isEditMode || isCreateMode ? (
                                    <input
                                      id="email"
                                      name="email"
                                      type="email"
                                      value={formData.email}
                                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                      className="block w-full rounded-md bg-white px-3 py-1.5 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-600"
                                    />
                                  ) : (
                                    <p className="text-sm text-gray-900">{formData.email}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="border-b border-gray-200">
                              <div className="px-4 py-5 sm:px-6">
                                <label htmlFor="avatar" className="block text-base font-semibold text-gray-900 mb-2">
                                  Avatar Color
                                </label>
                                <div className="flex items-center gap-x-3">
                                  <div
                                    className="size-12 flex-none rounded-full flex items-center justify-center text-white font-semibold text-sm"
                                    style={{ backgroundColor: formData.color }}
                                  >
                                    {getInitials(formData.name, formData.lastName)}
                                  </div>
                                  {isEditMode || isCreateMode ? (
                                    <input
                                      id="color"
                                      name="color"
                                      type="color"
                                      value={formData.color}
                                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                      className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                                    />
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            {/* Personal Information */}
                            <div className="border-b border-gray-200 bg-gray-50/50">
                              <div className="px-4 py-5 sm:px-6">
                                <label htmlFor="first-name" className="block text-base font-semibold text-gray-900 mb-2">
                                  First name
                                </label>
                                <div>
                                  {isEditMode || isCreateMode ? (
                                    <input
                                      id="first-name"
                                      name="first-name"
                                      type="text"
                                      value={formData.name}
                                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                      className="block w-full rounded-md bg-white px-3 py-1.5 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-600"
                                    />
                                  ) : (
                                    <p className="text-sm text-gray-900">{formData.name || "N/A"}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="border-b border-gray-200">
                              <div className="px-4 py-5 sm:px-6">
                                <label htmlFor="last-name" className="block text-base font-semibold text-gray-900 mb-2">
                                  Last name
                                </label>
                                <div>
                                  {isEditMode || isCreateMode ? (
                                    <input
                                      id="last-name"
                                      name="last-name"
                                      type="text"
                                      value={formData.lastName}
                                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                      className="block w-full rounded-md bg-white px-3 py-1.5 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-600"
                                    />
                                  ) : (
                                    <p className="text-sm text-gray-900">{formData.lastName || "N/A"}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="border-b border-gray-200 bg-gray-50/50">
                              <div className="px-4 py-5 sm:px-6">
                                <label htmlFor="rut" className="block text-base font-semibold text-gray-900 mb-2">
                                  Chilean RUT Number
                                </label>
                                <div>
                                  {isEditMode || isCreateMode ? (
                                    <input
                                      id="rut"
                                      name="rut"
                                      type="text"
                                      value={formData.chileanRutNumber}
                                      onChange={(e) => setFormData({ ...formData, chileanRutNumber: e.target.value })}
                                      className="block w-full rounded-md bg-white px-3 py-1.5 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-600"
                                    />
                                  ) : (
                                    <p className="text-sm text-gray-900">{formData.chileanRutNumber || "N/A"}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Security & Roles */}
                            {(isEditMode || isCreateMode) && (
                              <>
                                <div className="border-b border-gray-200">
                                  <div className="px-4 py-5 sm:px-6">
                                    <label htmlFor="password" className="block text-base font-semibold text-gray-900 mb-2">
                                      {isCreateMode ? "Password" : "New Password (leave blank to keep current)"}
                                    </label>
                                    <div className="flex gap-2">
                                      <input
                                        id="password"
                                        name="password"
                                        type={isCreateMode ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="block flex-1 rounded-md bg-white px-3 py-1.5 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-600"
                                      />
                                      {isCreateMode && (
                                        <button
                                          type="button"
                                          onClick={generatePassword}
                                          className="inline-flex items-center justify-center rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 cursor-pointer"
                                          title="Generate random password"
                                        >
                                          <KeyIcon className="size-5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {!isCreateMode && (
                                  <div className="border-b border-gray-200 bg-gray-50/50">
                                    <div className="px-4 py-5 sm:px-6">
                                      <label htmlFor="confirm-password" className="block text-base font-semibold text-gray-900 mb-2">
                                        Confirm Password
                                      </label>
                                      <div>
                                        <input
                                          id="confirm-password"
                                          name="confirm-password"
                                          type="password"
                                          value={formData.confirmPassword}
                                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                          className="block w-full rounded-md bg-white px-3 py-1.5 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-600"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}

                            <fieldset className="border-b border-gray-200">
                              <div className="px-4 py-5 sm:px-6">
                                <legend className="block text-base font-semibold text-gray-900 mb-2">Roles</legend>
                                <div className="space-y-4">
                                  {roles.map((role) => (
                                    <div key={role.id} className="relative flex items-start">
                                      <div className="absolute flex h-6 items-center">
                                        <div className="group grid size-4 grid-cols-1">
                                          <input
                                            id={`role-${role.id}`}
                                            name={`role-${role.id}`}
                                            type="checkbox"
                                            checked={formData.roleIds.includes(role.id)}
                                            onChange={(e) => {
                                              if (isEditMode || isCreateMode) {
                                                if (e.target.checked) {
                                                  setFormData({ ...formData, roleIds: [...formData.roleIds, role.id] });
                                                } else {
                                                  setFormData({
                                                    ...formData,
                                                    roleIds: formData.roleIds.filter((id) => id !== role.id),
                                                  });
                                                }
                                              }
                                            }}
                                            onKeyDown={(e) => {
                                              if ((isEditMode || isCreateMode) && e.key === "Enter") {
                                                e.preventDefault();
                                                if (formData.roleIds.includes(role.id)) {
                                                  setFormData({
                                                    ...formData,
                                                    roleIds: formData.roleIds.filter((id) => id !== role.id),
                                                  });
                                                } else {
                                                  setFormData({ ...formData, roleIds: [...formData.roleIds, role.id] });
                                                }
                                              }
                                            }}
                                            disabled={!isEditMode && !isCreateMode}
                                            className={`col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-primary-600 checked:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 ${
                                              isEditMode || isCreateMode ? "cursor-pointer" : ""
                                            }`}
                                          />
                                          <svg
                                            fill="none"
                                            viewBox="0 0 14 14"
                                            className={`pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white ${
                                              formData.roleIds.includes(role.id) ? "opacity-100" : "opacity-0"
                                            }`}
                                          >
                                            <path d="M3 8L6 11L11 3.5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                          </svg>
                                        </div>
                                      </div>
                                      <div className="pl-7 text-sm/6">
                                        <label
                                          htmlFor={`role-${role.id}`}
                                          className={`font-medium text-gray-900 ${isEditMode || isCreateMode ? "cursor-pointer" : ""}`}
                                        >
                                          {role.name}
                                        </label>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </fieldset>

                            {!isEditMode && !isCreateMode && selectedUser && (
                              <div className="border-b border-gray-200">
                                <div className="px-4 py-5 sm:px-6 space-y-2">
                                  <p className="text-sm text-gray-900">
                                    <span className="text-base font-semibold text-gray-900">Created:</span> {formatDate(selectedUser.createdAt)}
                                  </p>
                                  <p className="text-sm text-gray-900">
                                    <span className="text-base font-semibold text-gray-900">Last Login:</span> {formatLastLogin(selectedUser.lastLogin).text}
                                  </p>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 justify-between items-center px-4 py-4">
                    {!isCreateMode && selectedUser && currentUser && selectedUser.id !== currentUser.id && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setReset2FADialogOpen(true)}
                          className="inline-flex justify-center rounded-md bg-orange-600 px-2 py-2 text-xs font-semibold text-white shadow-xs hover:bg-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 cursor-pointer sm:px-3 sm:text-sm"
                        >
                          Reset 2FA
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteDialogOpen(true)}
                          className="inline-flex justify-center rounded-md bg-red-600 px-2 py-2 text-xs font-semibold text-white shadow-xs hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 cursor-pointer sm:px-3 sm:text-sm"
                        >
                          Delete User
                        </button>
                      </div>
                    )}
                    {!isCreateMode && (!selectedUser || !currentUser || selectedUser.id === currentUser.id) && <div />}
                    {isCreateMode && <div />}
                    <div className={`flex gap-x-3 ${!isCreateMode && selectedUser && currentUser && selectedUser.id !== currentUser.id ? 'ml-2 sm:ml-auto' : 'ml-auto'}`}>
                      <button
                        type="button"
                        onClick={isEditMode || isCreateMode ? handleCancel : closeDialog}
                        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 cursor-pointer"
                      >
                        {isEditMode || isCreateMode ? "Cancel" : "Close"}
                      </button>
                      {isEditMode || isCreateMode ? (
                        <button
                          type="button"
                          onClick={handleSave}
                          className="inline-flex justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 cursor-pointer"
                        >
                          {isCreateMode ? "Create" : "Save"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleEdit}
                          className="inline-flex justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 cursor-pointer"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </DialogPanel>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Reset 2FA Confirmation Dialog */}
      <ConfirmationDialog
        open={reset2FADialogOpen}
        onClose={() => setReset2FADialogOpen(false)}
        variant="orange"
        title="Reset Two-Factor Authentication"
        message={`Are you sure you want to reset 2FA for ${selectedUser ? `${selectedUser.name} ${selectedUser.lastName}` : "this user"}? This will clear their 2FA configuration and allow them to set it up again on their next login if system 2FA is enabled. This action cannot be undone.`}
        confirmButtonText="Reset 2FA"
        onConfirm={handleForceReset2FA}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        variant="red"
        title="Delete user"
        message={`Are you sure you want to delete ${selectedUser ? `${selectedUser.name} ${selectedUser.lastName}` : "this user"}? All of their data will be permanently removed. This action cannot be undone.`}
        confirmButtonText="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default UserManagement;
