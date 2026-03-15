"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

const API_URL = "";

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "admin" | "editor";
  permissions: string[];
  isActive: boolean;
  lastLogin?: string;
  isOnline?: boolean;
}

interface CurrentUser {
  id: string;
  name: string;
  username: string;
  role: "admin" | "editor";
  permissions: string[] | null;
}

export default function UsersManagementTab() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    id: string;
    name: string;
  }>({ show: false, id: "", name: "" });
  const [token, setToken] = useState("");
  const { showToast } = useToast();

  // Get auth token and current user from localStorage
  useEffect(() => {
    const authToken = localStorage.getItem("adminToken");
    const userData = localStorage.getItem("adminUser");

    if (!authToken) {
      router.push("/admin/login");
      return;
    }

    setToken(authToken);
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }

    // If user is admin, fetch all users; if editor, just show their own profile
    if (userData) {
      const user = JSON.parse(userData);
      if (user.role === "admin") {
        fetchUsers(authToken);
      } else {
        setUsers([user]);
        setLoading(false);
      }
    }
  }, [router]);

  const fetchUsers = async (authToken: string) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/admin/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setDeletingId(deleteConfirm.id);

      const response = await fetch(
        `${API_URL}/api/admin/users/${deleteConfirm.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.error || response.statusText || "Unknown error";
        throw new Error(errorMessage);
      }

      setUsers(users.filter((u) => u.id !== deleteConfirm.id));
      showToast({
        type: "success",
        title: "User Deleted",
        message: `"${deleteConfirm.name}" has been deleted successfully.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      showToast({
        type: "error",
        title: "Delete Failed",
        message: errorMessage,
      });
      console.error("Delete user error:", err);
    } finally {
      setDeletingId(null);
      setDeleteConfirm({ show: false, id: "", name: "" });
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update user: ${response.statusText}`);
      }

      const data = await response.json();
      const updatedUser = data.user;
      setUsers(users.map((u) => (u.id === id ? updatedUser : u)));
      showToast({
        type: "success",
        title: "User Updated",
        message: `User ${updatedUser.isActive ? "activated" : "deactivated"} successfully`,
      });
    } catch (err) {
      showToast({
        type: "error",
        title: "Update Failed",
        message: err instanceof Error ? err.message : "Unknown error",
      });
      console.error("Update user error:", err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-[#3e2723]">
          {currentUser?.role === "admin"
            ? `Manage Users (${users.length})`
            : "My Profile"}
        </h3>
        {currentUser?.role === "admin" && (
          <button
            onClick={() => router.push("/admin/users/create")}
            className="px-4 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition duration-300 font-semibold"
          >
            + Create User
          </button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 backdrop-blur-sm bg-white/30"
            onClick={() => setDeleteConfirm({ show: false, id: "", name: "" })}
          />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete User
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete &quot;{deleteConfirm.name}
                &quot;? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() =>
                    setDeleteConfirm({ show: false, id: "", name: "" })
                  }
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg p-8 shadow-lg border border-[#d7ccc8] text-center">
          <p className="text-gray-600">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-lg p-8 shadow-lg border border-[#d7ccc8] text-center">
          <p className="text-gray-600 mb-4">No users yet</p>
          <button
            onClick={() => router.push("/admin/users/create")}
            className="inline-block px-4 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition duration-300"
          >
            Create First User
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg border border-[#d7ccc8] overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[#d7ccc8] bg-[#fcfaf6]">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Name
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Username
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Role
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Permissions
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Active
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Last Login
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Online
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-[#d7ccc8]/50 hover:bg-[#fcfaf6] transition duration-200"
                >
                  <td className="py-3 px-4 text-sm font-medium">{user.name}</td>
                  <td className="py-3 px-4 text-sm font-mono text-[#4e342e]">
                    @{user.username}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {user.role === "admin" ? (
                      <span className="text-green-600 font-semibold">
                        All Access
                      </span>
                    ) : user.permissions && user.permissions.length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                        {user.permissions.map((perm) => (
                          <span
                            key={perm}
                            className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">None</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <button
                      onClick={() => handleToggleActive(user.id, user.isActive)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition duration-200 ${
                        user.isActive
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Never"}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        user.isOnline
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          user.isOnline
                            ? "bg-green-500 animate-pulse"
                            : "bg-gray-400"
                        }`}
                      ></span>
                      {user.isOnline ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          router.push(`/admin/users/edit/${user.id}`)
                        }
                        className="text-[#4e342e] hover:text-[#3e2723] hover:underline font-semibold"
                      >
                        Edit
                      </button>
                      {currentUser?.role === "admin" && (
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              show: true,
                              id: user.id,
                              name: user.name,
                            })
                          }
                          disabled={deletingId === user.id}
                          className={`font-semibold ${
                            deletingId === user.id
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-red-600 hover:text-red-700 hover:underline"
                          }`}
                        >
                          {deletingId === user.id ? "Deleting..." : "Delete"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
