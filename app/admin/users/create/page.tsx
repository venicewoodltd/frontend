"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CircularProgress from "@/components/ui/CircularProgress";
import { useToast } from "@/components/ui/Toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const MODULES = [
  { id: "products", label: "Products", icon: "P" },
  { id: "projects", label: "Projects", icon: "Pr" },
  { id: "blogs", label: "Blog Articles", icon: "B" },
  { id: "inquiries", label: "Inquiries", icon: "I" },
  { id: "testimonials", label: "Testimonials", icon: "T" },
];

export default function CreateUserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    role: "editor",
    permissions: [] as string[],
    password: "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploadProgress, setPhotoUploadProgress] = useState(0);
  const { showToast } = useToast();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };
      // Reset permissions if switching to admin
      if (name === "role" && value === "admin") {
        updated.permissions = [];
      }
      return updated;
    });
  };

  const handlePermissionToggle = (module: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(module)
        ? prev.permissions.filter((p) => p !== module)
        : [...prev.permissions, module],
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    const trimmedName = formData.name.trim();
    const trimmedUsername = formData.username.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedPassword = formData.password ? formData.password.trim() : "";

    if (!trimmedName) {
      setError("Name is required");
      return;
    }
    if (!trimmedUsername) {
      setError("Username is required");
      return;
    }
    if (!trimmedEmail) {
      setError("Email is required");
      return;
    }
    if (formData.role === "editor" && formData.permissions.length === 0) {
      setError("Editor must have at least one permission");
      return;
    }
    if (trimmedPassword && trimmedPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");

      if (!token) {
        router.push("/admin/login");
        return;
      }

      // Create user
      const createResponse = await fetch(`${API_URL}/api/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: trimmedName,
          username: trimmedUsername,
          email: trimmedEmail,
          role: formData.role,
          permissions: formData.role === "admin" ? null : formData.permissions,
          password: trimmedPassword || undefined,
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(
          errorData.error ||
            `Failed to create user: ${createResponse.statusText}`,
        );
      }

      const userData = await createResponse.json();
      const userId = userData.user.id;

      // Upload photo if provided
      if (photo) {
        setPhotoUploading(true);
        setPhotoUploadProgress(0);
        const photoFormData = new FormData();
        photoFormData.append("photo", photo);

        try {
          await new Promise<void>((resolve, reject) => {
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
                resolve();
              } else {
                console.warn("Failed to upload photo, but user was created");
                resolve();
              }
            });
            xhr.addEventListener("error", () => {
              console.warn("Failed to upload photo, but user was created");
              resolve();
            });
            xhr.open(
              "POST",
              `${API_URL}/api/admin/users/photo?userId=${userId}`,
            );
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            xhr.send(photoFormData);
          });
        } finally {
          setPhotoUploading(false);
          setPhotoUploadProgress(0);
        }
      }

      setSuccess(
        userData.user && userData.user.tempPassword
          ? `User "${formData.name}" created! Temporary password: ${userData.user.tempPassword}`
          : `User "${formData.name}" created successfully!`,
      );
      showToast({
        type: "success",
        title: "User Created",
        message: `User "${formData.name}" created successfully!`,
      });

      setTimeout(() => {
        router.push("/admin?tab=users");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
      showToast({
        type: "error",
        title: "Create Failed",
        message: err instanceof Error ? err.message : "Failed to create user",
      });
      console.error("Create user error:", err);
    } finally {
      setLoading(false);
    }
  };

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
            Create New User
          </h1>
          <p className="text-gray-600 mt-2">
            Add a new admin or editor user to the system
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg border border-[#d7ccc8] p-8">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              ✕ {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              ✓ {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="w-full px-4 py-3 border-2 border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                Username (unique identifier) *
              </label>
              <div className="flex items-center">
                <span className="text-gray-600 mr-2">@</span>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="john-doe"
                  className="flex-1 px-4 py-3 border-2 border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Use lowercase letters, hyphens, and numbers only
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@example.com"
                className="w-full px-4 py-3 border-2 border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition"
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                User Role *
              </label>
              <div className="flex gap-4">
                {[
                  {
                    value: "admin",
                    label: "Admin",
                    description: "Full access to all features",
                  },
                  {
                    value: "editor",
                    label: "Editor",
                    description: "Limited access based on permissions",
                  },
                ].map((role) => (
                  <label
                    key={role.value}
                    className={`flex-1 cursor-pointer p-4 rounded-lg border-2 transition ${
                      formData.role === role.value
                        ? "border-[#4e342e] bg-[#4e342e]/5"
                        : "border-[#d7ccc8] hover:border-[#4e342e]/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={formData.role === role.value}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="font-semibold text-[#3e2723]">
                      {role.label}
                    </span>
                    <p className="text-xs text-gray-600 mt-1">
                      {role.description}
                    </p>
                  </label>
                ))}
              </div>
            </div>

            {/* Permissions (only for Editor) */}
            {formData.role === "editor" && (
              <div>
                <label className="block text-sm font-semibold text-[#3e2723] mb-3">
                  Editor Permissions *
                </label>
                <p className="text-xs text-gray-600 mb-4">
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
              </div>
            )}

            {/* Password (optional) */}
            <div>
              <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                Initial Password (optional)
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Set initial password (min 8 chars)"
                className="w-full px-4 py-3 border-2 border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition"
                autoComplete="new-password"
              />
              <p className="text-xs text-gray-500 mt-2">
                Leave blank to auto-generate a temporary password
              </p>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                Profile Photo (Optional)
              </label>
              <div className="flex gap-4">
                {photoPreview && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-[#d7ccc8]">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    {photoUploading && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                        <CircularProgress
                          progress={photoUploadProgress}
                          size={36}
                          strokeWidth={3}
                        />
                      </div>
                    )}
                  </div>
                )}
                <label className="flex-1 flex flex-col items-center justify-center px-4 py-6 border-2 border-dashed border-[#d7ccc8] rounded-lg cursor-pointer hover:border-[#4e342e] transition">
                  <span className="text-2xl mb-2 text-[#4e342e]">+</span>
                  <span className="text-sm font-semibold text-[#3e2723]">
                    Click to upload photo
                  </span>
                  <span className="text-xs text-gray-600 mt-1">
                    JPG, PNG up to 10MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6 border-t border-[#d7ccc8]">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border-2 border-[#d7ccc8] text-[#3e2723] rounded-lg hover:bg-[#fcfaf6] transition font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] disabled:bg-gray-400 transition font-semibold"
              >
                {loading ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
