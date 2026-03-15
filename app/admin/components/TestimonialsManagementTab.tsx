"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";

const API_URL = "";

interface Testimonial {
  id: string;
  author: string;
  content: string;
  featured: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export default function TestimonialsManagementTab() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    id: string;
    author: string;
  }>({ show: false, id: "", author: "" });
  const [previewTestimonial, setPreviewTestimonial] =
    useState<Testimonial | null>(null);
  const [formData, setFormData] = useState({
    author: "",
    content: "",
    featured: false,
  });
  const { showToast } = useToast();

  const token =
    typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

  const fetchTestimonials = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/testimonials`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setTestimonials(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchTestimonials();
    }
  }, [token, fetchTestimonials]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.author.trim() || !formData.content.trim()) {
      showToast({
        type: "warning",
        title: "Validation",
        message: "Author and content are required",
      });
      return;
    }

    try {
      const url = editingId
        ? `${API_URL}/api/admin/testimonials/${editingId}`
        : `${API_URL}/api/admin/testimonials`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        showToast({
          type: "success",
          title: editingId ? "Testimonial Updated" : "Testimonial Created",
          message: editingId
            ? "Testimonial updated successfully!"
            : "Testimonial created successfully!",
        });
        resetForm();
        setView("list");
        fetchTestimonials();
      } else {
        showToast({
          type: "error",
          title: "Error",
          message: data.message || "Failed to save testimonial",
        });
      }
    } catch (error) {
      console.error("Error submitting testimonial:", error);
      showToast({
        type: "error",
        title: "Submit Failed",
        message: "Failed to submit testimonial",
      });
    }
  };

  const handleEdit = (testimonial: Testimonial) => {
    setFormData({
      author: testimonial.author,
      content: testimonial.content,
      featured: testimonial.featured,
    });
    setEditingId(testimonial.id);
    setView("edit");
  };

  const handleDelete = async () => {
    try {
      setDeletingId(deleteConfirm.id);
      const response = await fetch(
        `${API_URL}/api/admin/testimonials/${deleteConfirm.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (data.success) {
        showToast({
          type: "success",
          title: "Testimonial Deleted",
          message: "Testimonial deleted successfully!",
        });
        fetchTestimonials();
      } else {
        showToast({
          type: "error",
          title: "Delete Failed",
          message: data.message || "Failed to delete",
        });
      }
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      showToast({
        type: "error",
        title: "Delete Error",
        message: "Failed to delete testimonial",
      });
    } finally {
      setDeletingId(null);
      setDeleteConfirm({ show: false, id: "", author: "" });
    }
  };

  const resetForm = () => {
    setFormData({
      author: "",
      content: "",
      featured: false,
    });
    setEditingId(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6">
      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 backdrop-blur-sm bg-white/30"
            onClick={() =>
              setDeleteConfirm({ show: false, id: "", author: "" })
            }
          />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Testimonial
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete the testimonial by &quot;
                {deleteConfirm.author}
                &quot;? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() =>
                    setDeleteConfirm({ show: false, id: "", author: "" })
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

      {/* LIST VIEW */}
      {view === "list" && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-[#3e2723]">
              Testimonials ({testimonials.length})
            </h3>
            <button
              onClick={() => {
                resetForm();
                setView("create");
              }}
              className="px-4 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition duration-300"
            >
              + Add Testimonial
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg p-8 shadow-lg border border-[#d7ccc8] text-center">
              <p className="text-gray-600">Loading testimonials...</p>
            </div>
          ) : testimonials.length === 0 ? (
            <div className="bg-white rounded-lg p-8 shadow-lg border border-[#d7ccc8] text-center">
              <p className="text-gray-600 mb-4">No testimonials yet</p>
              <button
                onClick={() => {
                  resetForm();
                  setView("create");
                }}
                className="inline-block px-4 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723]"
              >
                Create First Testimonial
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg border border-[#d7ccc8] overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[#d7ccc8] bg-[#fcfaf6]">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold">
                      Author
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">
                      Content
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">
                      Featured
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">
                      Created
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">
                      Modified
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {testimonials.map((testimonial) => (
                    <tr
                      key={testimonial.id}
                      className="border-b border-[#d7ccc8]/50 hover:bg-[#fcfaf6] transition duration-200"
                    >
                      <td className="py-3 px-4 text-sm font-medium">
                        <div>
                          <p className="font-semibold">{testimonial.author}</p>
                          {testimonial.createdBy && (
                            <p className="text-xs text-gray-500">
                              by {testimonial.createdBy}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                        {testimonial.content.length > 80
                          ? testimonial.content.substring(0, 80) + "..."
                          : testimonial.content}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            testimonial.featured
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {testimonial.featured ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(testimonial.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {testimonial.updatedAt
                          ? formatDate(testimonial.updatedAt)
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPreviewTestimonial(testimonial)}
                            className="text-blue-600 hover:text-blue-700 hover:underline font-semibold"
                          >
                            Preview
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleEdit(testimonial)}
                            className="text-[#4e342e] hover:text-[#3e2723] hover:underline font-semibold"
                          >
                            Edit
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                show: true,
                                id: testimonial.id,
                                author: testimonial.author,
                              })
                            }
                            disabled={deletingId === testimonial.id}
                            className={`${
                              deletingId === testimonial.id
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-red-600 hover:text-red-700 hover:underline"
                            } font-semibold`}
                          >
                            {deletingId === testimonial.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* CREATE/EDIT FORM */}
      {(view === "create" || view === "edit") && (
        <div className="bg-white rounded-lg shadow-lg border border-[#d7ccc8] p-8 max-w-2xl">
          <h3 className="text-2xl font-serif font-bold text-[#3e2723] mb-6">
            {editingId ? "Edit Testimonial" : "Add New Testimonial"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Author */}
            <div>
              <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                Author Name *
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                placeholder="Client or project name"
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg text-[#3e2723] focus:ring-[#4e342e] focus:border-[#4e342e]"
                required
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                Testimonial Content *
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="What did they say about your work?"
                rows={5}
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg text-[#3e2723] focus:ring-[#4e342e] focus:border-[#4e342e]"
                required
              />
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="featured"
                id="featured"
                checked={formData.featured}
                onChange={handleInputChange}
                className="w-5 h-5 rounded border-[#d7ccc8] text-[#4e342e] focus:ring-[#4e342e]"
              />
              <label
                htmlFor="featured"
                className="text-sm font-semibold text-[#3e2723]"
              >
                Featured on homepage
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-[#4e342e] text-white font-semibold rounded-lg hover:bg-[#3e2723] transition duration-300"
              >
                {editingId ? "Update Testimonial" : "Create Testimonial"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setPreviewTestimonial({
                    ...formData,
                    id: "preview",
                    createdAt: new Date().toISOString(),
                  })
                }
                className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition duration-300"
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setView("list");
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition duration-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewTestimonial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-8 relative">
            {/* Close Button */}
            <button
              onClick={() => setPreviewTestimonial(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="text-center">
              <h3 className="text-xl font-serif font-bold text-[#3e2723] mb-2">
                Testimonial Preview
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                This is how the testimonial will appear on the website
              </p>
            </div>

            {/* Testimonial Card Preview */}
            <div className="bg-[#fcfaf6] rounded-lg p-6 border border-[#d7ccc8]">
              {/* Quote Icon */}
              <div className="text-[#4e342e] text-4xl mb-4">&ldquo;</div>

              {/* Content */}
              <p className="text-[#3e2723] text-lg leading-relaxed mb-6 italic">
                {previewTestimonial.content}
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#4e342e] flex items-center justify-center text-white font-bold text-lg">
                  {previewTestimonial.author.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-[#3e2723]">
                    {previewTestimonial.author}
                  </p>
                  {previewTestimonial.featured && (
                    <span className="text-xs text-blue-600 font-medium">
                      Featured Testimonial
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Metadata */}
            {previewTestimonial.id !== "preview" && (
              <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>
                    Created: {formatDate(previewTestimonial.createdAt)}
                  </span>
                  {previewTestimonial.updatedAt && (
                    <span>
                      Modified: {formatDate(previewTestimonial.updatedAt)}
                    </span>
                  )}
                </div>
                {previewTestimonial.createdBy && (
                  <p className="mt-1">
                    Created by: {previewTestimonial.createdBy}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={() => setPreviewTestimonial(null)}
              className="mt-6 w-full px-4 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition duration-300"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
