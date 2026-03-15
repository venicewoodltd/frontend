"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import CategoryManagementModal from "./CategoryManagementModal";

interface Blog {
  id: string;
  slug?: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  status: "draft" | "published";
  featured: boolean;
  views?: number;
  readingTime?: number;
  image?: string;
  author?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

const API_URL = "";

export default function BlogsManagementTab() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    id: string;
    title: string;
  }>({ show: false, id: "", title: "" });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const { showToast } = useToast();

  // Fetch blogs
  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");

      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const response = await fetch(`${API_URL}/api/admin/blogs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorData: Record<string, unknown> = {};
        const contentType = response.headers.get("content-type");

        if (contentType?.includes("application/json")) {
          errorData = await response.json().catch(() => ({}));
        }

        const errorMsg =
          errorData.error || errorData.message || "Unknown error";
        throw new Error(
          `Failed to fetch blogs: ${response.status} ${response.statusText}. ${errorMsg}`,
        );
      }

      const data = await response.json();
      setBlogs(data.blogs || data.data || []);
    } catch (error) {
      console.error("❌ Error fetching blogs:", error);
      showToast({
        type: "error",
        title: "Load Failed",
        message:
          error instanceof Error ? error.message : "Failed to load blogs",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load blogs on component mount
  React.useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  // Handle delete
  const handleDelete = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");

      const response = await fetch(
        `${API_URL}/api/admin/blogs/${deleteConfirm.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete blog");
      }

      showToast({
        type: "success",
        title: "Blog Deleted",
        message: `"${deleteConfirm.title}" has been deleted successfully.`,
      });
      setDeleteConfirm({ show: false, id: "", title: "" });
      fetchBlogs();
    } catch (error) {
      console.error("Error deleting blog:", error);
      showToast({
        type: "error",
        title: "Delete Failed",
        message: "Failed to delete blog",
      });
    } finally {
      setLoading(false);
    }
  };

  // Navigate to edit
  const handleEdit = (id: string) => {
    router.push(`/admin/edit-blog/${id}`);
  };

  // Navigate to create
  const handleCreate = () => {
    router.push("/admin/create-blog");
  };

  // Format date time
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#4e342e]">
            Blog Management
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-300 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            Categories
          </button>
          <button
            onClick={handleCreate}
            className="bg-[#4e342e] text-white px-6 py-3 rounded-lg hover:bg-[#3e2723] transition flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create New Blog
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 backdrop-blur-sm bg-white/30"
            onClick={() => setDeleteConfirm({ show: false, id: "", title: "" })}
          />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Blog Post
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete &quot;{deleteConfirm.title}
                &quot;? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() =>
                    setDeleteConfirm({ show: false, id: "", title: "" })
                  }
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blog List */}
      <div className="bg-white rounded-lg shadow-lg border border-[#d7ccc8] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4e342e]"></div>
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto text-gray-300 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-500 mb-2">
              No blog posts yet
            </h3>
            <p className="text-gray-400 mb-4">
              Create your first blog post to get started
            </p>
            <button
              onClick={handleCreate}
              className="text-[#4e342e] hover:underline font-semibold"
            >
              + Create your first blog post
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#fcfaf6] border-b border-[#d7ccc8]">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#3e2723]">
                    Title
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#3e2723]">
                    Category
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#3e2723]">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#3e2723]">
                    Views
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#3e2723]">
                    Created By
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#3e2723]">
                    Modified At
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#3e2723]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {blogs.map((blog) => (
                  <tr
                    key={blog.id}
                    className="border-b border-[#d7ccc8]/50 hover:bg-[#fcfaf6] transition"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {blog.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={blog.image}
                            alt={blog.title}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {blog.title}
                          </p>
                          {blog.featured && (
                            <span className="text-xs text-amber-600">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm capitalize text-gray-700">
                      {blog.category}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          blog.status === "published"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {blog.status.charAt(0).toUpperCase() +
                          blog.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {blog.views || 0}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {blog.createdByName || blog.author || "Venice Wood Ltd"}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {formatDateTime(blog.updatedAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/blog/${blog.slug || blog.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 hover:underline text-sm font-medium"
                        >
                          View
                        </a>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleEdit(blog.id)}
                          className="text-[#4e342e] hover:text-[#3e2723] hover:underline text-sm font-medium"
                        >
                          Edit
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              show: true,
                              id: blog.id,
                              title: blog.title,
                            })
                          }
                          className="text-red-600 hover:text-red-700 hover:underline text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Category Management Modal */}
      <CategoryManagementModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        type="blog"
      />
    </div>
  );
}
