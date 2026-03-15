"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import CircularProgress from "@/components/ui/CircularProgress";
import { useToast } from "@/components/ui/Toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const MODULES = [
  { id: "products", label: "Products", icon: "P" },
  { id: "projects", label: "Projects", icon: "Pr" },
  { id: "blogs", label: "Blog Articles", icon: "B" },
  { id: "inquiries", label: "Inquiries", icon: "I" },
  { id: "testimonials", label: "Testimonials", icon: "T" },
];

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "admin" | "editor";
  permissions?: string[];
  isActive: boolean;
  photoFileId?: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { showToast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    permissions: [] as string[],
    isActive: true,
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploadProgress, setPhotoUploadProgress] = useState(0);
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("adminToken") : "";
  let currentUser: { id?: string; role?: "admin" | "editor" } = {};
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("adminUser");
      currentUser = stored ? JSON.parse(stored) : {};
    } catch {
      currentUser = {};
    }
  }

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!token) {
          router.push("/admin/login");
          return;
        }

        // Check if current user is trying to access another user's profile
        if (
          currentUser.id &&
          currentUser.id !== userId &&
          currentUser.role !== "admin"
        ) {
          setError("You don't have permission to edit this user's profile");
          setLoading(false);
          return;
        }

        // Use appropriate endpoint based on user role
        let endpoint = `${API_URL}/api/admin/users/${userId}`;

        // For editors, use the /profile/me endpoint to fetch their own profile
        if (currentUser.id === userId && currentUser.role !== "admin") {
          endpoint = `${API_URL}/api/admin/users/profile/me`;
        }

        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 403) {
            setError("You don't have permission to access this user");
            setLoading(false);
            return;
          }
          throw new Error("Failed to fetch user");
        }

        const data = await response.json();
        setUser(data.user);
        setFormData({
          name: data.user.name,
          email: data.user.email,
          permissions: data.user.permissions || [],
          isActive: data.user.isActive,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch user");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, token, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handlePermissionToggle = (module: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(module)
        ? prev.permissions.filter((p) => p !== module)
        : [...prev.permissions, module],
    }));
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    try {
      setSaving(true);

      // Use appropriate endpoint based on user role
      let endpoint = `${API_URL}/api/admin/users/${userId}`;
      let payload: {
        name: string;
        email: string;
        permissions?: string[] | null;
        isActive?: boolean;
      } = {
        name: formData.name,
        email: formData.email,
        permissions: user?.role === "editor" ? formData.permissions : null,
        isActive: formData.isActive,
      };

      // For editors, use the /profile/me endpoint to update their own profile
      if (currentUser.id === userId && currentUser.role !== "admin") {
        endpoint = `${API_URL}/api/admin/users/profile/me`;
        // Remove fields editors can't change
        payload = {
          name: formData.name,
          email: formData.email,
        };
      }

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to update user: ${response.statusText}`,
        );
      }

      const data = await response.json();
      setUser(data.user);
      // Sync formData with the actual saved values from the server
      setFormData((prev) => ({
        ...prev,
        name: data.user.name || prev.name,
        email: data.user.email || prev.email,
        permissions: data.user.permissions || [],
        isActive: data.user.isActive ?? prev.isActive,
      }));
      setSuccess("User updated successfully");
      showToast({
        type: "success",
        title: "User Updated",
        message: "User profile updated successfully",
      });

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      const errMsg =
        err instanceof Error ? err.message : "Failed to update user";
      setError(errMsg);
      showToast({ type: "error", title: "Update Failed", message: errMsg });
      console.error("Update user error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_URL}/api/admin/users/${userId}/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            newPassword: newPassword,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to reset password: ${response.statusText}`,
        );
      }

      setSuccess("Password reset successfully");
      showToast({
        type: "success",
        title: "Password Reset",
        message: "Password has been reset successfully",
      });
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordReset(false);

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      const errMsg =
        err instanceof Error ? err.message : "Failed to reset password";
      setError(errMsg);
      showToast({
        type: "error",
        title: "Password Reset Failed",
        message: errMsg,
      });
      console.error("Reset password error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Store the file name for display
    setPhotoFile(file);

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      setPhotoFile(null);
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB");
      setPhotoFile(null);
      return;
    }

    try {
      setSaving(true);
      setPhotoUploading(true);
      setPhotoUploadProgress(0);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("photo", file);

      const data = await new Promise<{ photoFileId: string }>(
        (resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              setPhotoUploadProgress(
                Math.round((event.loaded / event.total) * 100),
              );
            }
          });
          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve(JSON.parse(xhr.responseText));
              } catch {
                reject(new Error("Failed to parse response"));
              }
            } else {
              try {
                const errorData = JSON.parse(xhr.responseText);
                reject(
                  new Error(
                    errorData.error ||
                      `Failed to upload photo: ${xhr.statusText}`,
                  ),
                );
              } catch {
                reject(new Error(`Failed to upload photo: ${xhr.statusText}`));
              }
            }
          });
          xhr.addEventListener("error", () =>
            reject(new Error("Upload request failed")),
          );
          xhr.open("POST", `${API_URL}/api/admin/users/photo?userId=${userId}`);
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          xhr.send(formData);
        },
      );
      setUser((prev) =>
        prev ? { ...prev, photoFileId: data.photoFileId } : null,
      );

      // Update localStorage with new photoFileId only if editing own profile
      if (currentUser.id === userId) {
        const storedUser = localStorage.getItem("adminUser");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          parsedUser.photoFileId = data.photoFileId;
          localStorage.setItem("adminUser", JSON.stringify(parsedUser));
        }
      }

      setSuccess("Profile picture updated successfully");
      showToast({
        type: "success",
        title: "Photo Uploaded",
        message: "Profile picture updated successfully",
      });
      setPhotoFile(null);

      // Reset file input
      e.target.value = "";

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      const errMsg =
        err instanceof Error ? err.message : "Failed to upload photo";
      setError(errMsg);
      showToast({ type: "error", title: "Upload Failed", message: errMsg });
      console.error("Photo upload error:", err);
      setPhotoFile(null);
    } finally {
      setSaving(false);
      setPhotoUploading(false);
      setPhotoUploadProgress(0);
    }
  };

  const handleDeletePhoto = async () => {
    if (!user?.photoFileId) return;
    if (!window.confirm("Are you sure you want to remove the profile photo?"))
      return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/admin/users/photo?userId=${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to delete photo: ${response.statusText}`,
        );
      }

      setUser((prev) => (prev ? { ...prev, photoFileId: undefined } : null));

      // Update localStorage if editing own profile
      if (currentUser.id === userId) {
        const storedUser = localStorage.getItem("adminUser");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          delete parsedUser.photoFileId;
          localStorage.setItem("adminUser", JSON.stringify(parsedUser));
        }
      }

      setSuccess("Profile photo removed successfully");
      showToast({
        type: "success",
        title: "Photo Removed",
        message: "Profile photo removed successfully",
      });
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      const errMsg =
        err instanceof Error ? err.message : "Failed to delete photo";
      setError(errMsg);
      showToast({ type: "error", title: "Delete Failed", message: errMsg });
      console.error("Delete photo error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfaf6] flex items-center justify-center">
        <p className="text-gray-600">Loading user...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fcfaf6] flex items-center justify-center">
        <p className="text-red-600">User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfaf6] text-[#3e2723]">
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-[#4e342e] hover:text-[#3e2723] mb-4 font-semibold"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-serif font-bold text-[#4e342e]">
            Edit User: {user.name}
          </h1>
          <p className="text-gray-600 mt-2">@{user.username}</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg border border-[#d7ccc8] p-8 space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              ✕ {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              ✓ {success}
            </div>
          )}

          {/* User Info Section */}
          <form onSubmit={handleUpdateUser} className="space-y-6">
            <div className="border-b border-[#d7ccc8] pb-6">
              <h2 className="text-lg font-semibold text-[#3e2723] mb-4">
                User Information
              </h2>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition"
                  />
                </div>

                {/* Profile Picture */}
                <div>
                  <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                    Profile Picture
                  </label>
                  <div className="flex items-start gap-6">
                    {/* Current Photo Display */}
                    <div className="flex flex-col items-center">
                      <div className="relative w-24 h-24 rounded-full bg-[#4e342e] text-white flex items-center justify-center text-3xl font-bold mb-2 border-2 border-[#d7ccc8]">
                        {user.photoFileId ? (
                          /* Using standard img tag for dynamic photo URLs from API */
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={user.photoFileId}
                            src={`${API_URL}/api/images/${user.photoFileId}`}
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                            onError={(e) => {
                              console.error(
                                "Failed to load profile photo:",
                                user.photoFileId,
                              );
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                        {photoUploading && (
                          <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                            <CircularProgress
                              progress={photoUploadProgress}
                              size={40}
                              strokeWidth={3}
                            />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 text-center">
                        {user.photoFileId ? "Current photo" : "No photo"}
                      </p>
                      {user.photoFileId && (
                        <button
                          type="button"
                          onClick={handleDeletePhoto}
                          disabled={saving}
                          className="text-xs text-red-600 hover:text-red-800 font-semibold transition mt-1"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>

                    {/* Upload Input */}
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-[#3e2723] mb-3">
                        Upload New Photo
                      </label>
                      <div className="flex flex-col gap-3">
                        <label className="flex items-center justify-center px-4 py-4 border-2 border-dashed border-[#d7ccc8] rounded-lg cursor-pointer hover:border-[#4e342e] hover:bg-[#fcfaf6] transition">
                          <div className="text-center">
                            <svg
                              className="mx-auto h-8 w-8 text-gray-400 mb-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                              />
                            </svg>
                            <p className="text-sm font-semibold text-[#3e2723]">
                              {photoFile
                                ? `Selected: ${photoFile.name}`
                                : "Click to select or drag image"}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              JPG, PNG, or WebP • Max 5MB
                            </p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            disabled={saving}
                            className="hidden"
                          />
                        </label>
                        {photoFile && (
                          <button
                            type="button"
                            disabled={saving}
                            className="text-xs text-gray-600 hover:text-red-600 transition"
                            onClick={() => setPhotoFile(null)}
                          >
                            Clear selection
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role Info - Admin only */}
                {currentUser.role === "admin" && (
                  <div>
                    <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                      Role
                    </label>
                    <div className="px-4 py-3 bg-[#fcfaf6] border-2 border-[#d7ccc8] rounded-lg text-[#3e2723]">
                      <span className="font-semibold capitalize">
                        {user.role}
                      </span>
                      <p className="text-xs text-gray-600 mt-1">
                        {user.role === "admin"
                          ? "Full access to all features"
                          : "Limited access based on permissions"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Status Toggle - Admin only */}
                {currentUser.role === "admin" && (
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-semibold text-[#3e2723]">
                        {formData.isActive ? "✓ Active" : "✕ Inactive"}
                      </span>
                    </label>
                    <p className="text-xs text-gray-600 mt-2">
                      {formData.isActive
                        ? "This user can log in"
                        : "This user is blocked from logging in"}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-4 py-2 border-2 border-[#d7ccc8] text-[#3e2723] rounded-lg hover:bg-[#fcfaf6] transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] disabled:bg-gray-400 transition font-semibold"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>

          {/* Permissions Section (Admin editing an editor only) */}
          {user.role === "editor" && currentUser.role === "admin" && (
            <div className="border-b border-[#d7ccc8] pb-6">
              <h2 className="text-lg font-semibold text-[#3e2723] mb-4">
                Editor Permissions
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Select which modules this editor can access
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {MODULES.map((module) => (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => handlePermissionToggle(module.id)}
                    className={`p-4 rounded-lg border-2 transition text-center ${
                      formData.permissions.includes(module.id)
                        ? "border-[#4e342e] bg-[#4e342e]/10"
                        : "border-[#d7ccc8] hover:border-[#4e342e]/50"
                    }`}
                  >
                    <div className="text-2xl mb-2">{module.icon}</div>
                    <span className="block font-semibold text-sm">
                      {module.label}
                    </span>
                    <span
                      className={`block text-xs mt-1 ${
                        formData.permissions.includes(module.id)
                          ? "text-[#4e342e]"
                          : "text-gray-500"
                      }`}
                    >
                      {formData.permissions.includes(module.id)
                        ? "✓ Selected"
                        : "Not selected"}
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  handleUpdateUser({
                    preventDefault: () => {},
                  } as React.FormEvent);
                }}
                className="mt-6 w-full px-4 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition font-semibold"
              >
                Save Permissions
              </button>
            </div>
          )}

          {/* Password Reset Section */}
          <div>
            <h2 className="text-lg font-semibold text-[#3e2723] mb-4">
              Password Management
            </h2>

            {showPasswordReset ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 8 characters)"
                    className="w-full px-4 py-3 border-2 border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 border-2 border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordReset(false);
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="flex-1 px-4 py-2 border-2 border-[#d7ccc8] text-[#3e2723] rounded-lg hover:bg-[#fcfaf6] transition font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition font-semibold"
                  >
                    {saving ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPasswordReset(true)}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
              >
                Reset User Password
              </button>
            )}
            <p className="text-xs text-gray-600 mt-4">
              ℹ️ Resetting password will set a temporary password. User must
              change it on next login.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
