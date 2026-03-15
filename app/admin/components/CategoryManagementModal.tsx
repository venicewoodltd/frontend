"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
  sortOrder: number;
  type?: "product" | "project" | "blog" | "inquiry";
}

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChange?: () => void;
  type?: "product" | "project" | "blog" | "inquiry";
}

const API_URL = "";

export default function CategoryManagementModal({
  isOpen,
  onClose,
  onCategoriesChange,
  type = "product",
}: CategoryManagementModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    category: Category | null;
  }>({ show: false, category: null });
  const { showToast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
    sortOrder: 0,
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${API_URL}/api/admin/categories?type=${type}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      } else {
        setError(data.error || "Failed to fetch categories");
      }
    } catch (err) {
      setError("Failed to fetch categories");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: "#3B82F6",
      sortOrder: categories.length,
    });
    setEditingCategory(null);
    setIsCreating(false);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color || "#3B82F6",
      sortOrder: category.sortOrder,
    });
    setIsCreating(false);
  };

  const handleCreate = () => {
    resetForm();
    setFormData((prev) => ({ ...prev, sortOrder: categories.length }));
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError("Category name is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("adminToken");

      const url = editingCategory
        ? `${API_URL}/api/admin/categories/${editingCategory.id}`
        : `${API_URL}/api/admin/categories`;

      const method = editingCategory ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...formData, type }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchCategories();
        resetForm();
        onCategoriesChange?.();
        showToast({
          type: "success",
          title: editingCategory ? "Category Updated" : "Category Created",
          message: `Category "${formData.name}" ${editingCategory ? "updated" : "created"} successfully!`,
        });
      } else {
        setError(data.error || "Failed to save category");
        showToast({
          type: "error",
          title: "Save Failed",
          message: data.error || "Failed to save category",
        });
      }
    } catch (err) {
      setError("Failed to save category");
      showToast({
        type: "error",
        title: "Save Error",
        message: "Failed to save category",
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const category = deleteConfirm.category;
    if (!category) return;

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("adminToken");

      const response = await fetch(
        `${API_URL}/api/admin/categories/${category.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (data.success) {
        await fetchCategories();
        onCategoriesChange?.();
        showToast({
          type: "success",
          title: "Category Deleted",
          message: `"${category.name}" deleted successfully.`,
        });
      } else {
        setError(data.error || "Failed to delete category");
        showToast({
          type: "error",
          title: "Delete Failed",
          message: data.error || "Failed to delete category",
        });
      }
    } catch (err) {
      setError("Failed to delete category");
      showToast({
        type: "error",
        title: "Delete Error",
        message: "Failed to delete category",
      });
      console.error(err);
    } finally {
      setLoading(false);
      setDeleteConfirm({ show: false, category: null });
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");

      const response = await fetch(
        `${API_URL}/api/admin/categories/${category.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isActive: !category.isActive }),
        },
      );

      const data = await response.json();

      if (data.success) {
        await fetchCategories();
        onCategoriesChange?.();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Manage Categories
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 p-1"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Create/Edit Form */}
          {(isCreating || editingCategory) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                {editingCategory ? "Edit Category" : "Create New Category"}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="e.g., Furniture, Decorative"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    rows={2}
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">
                      Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) =>
                          setFormData({ ...formData, color: e.target.value })
                        }
                        className="w-10 h-10 rounded cursor-pointer border"
                      />
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) =>
                          setFormData({ ...formData, color: e.target.value })
                        }
                        className="flex-1 px-3 py-2 border rounded-md text-sm"
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>
                  <div className="w-24">
                    <label className="block text-sm text-gray-600 mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sortOrder: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      min="0"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 bg-[#4e342e] text-white text-sm rounded-md hover:bg-[#3e2723] disabled:opacity-50"
                  >
                    {loading
                      ? "Saving..."
                      : editingCategory
                        ? "Update"
                        : "Create"}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Category Button */}
          {!isCreating && !editingCategory && (
            <button
              onClick={handleCreate}
              className="mb-4 flex items-center gap-2 px-4 py-2 bg-[#4e342e] text-white text-sm rounded-md hover:bg-[#3e2723]"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Category
            </button>
          )}

          {/* Categories List */}
          {loading && !categories.length ? (
            <div className="text-center py-8 text-gray-500">
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No categories yet. Create your first category above.
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    !category.isActive ? "bg-gray-50 opacity-60" : "bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color || "#6B7280" }}
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {category.name}
                        {!category.isActive && (
                          <span className="ml-2 text-xs text-gray-400">
                            (Inactive)
                          </span>
                        )}
                      </div>
                      {category.description && (
                        <div className="text-sm text-gray-500">
                          {category.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(category)}
                      className={`px-2 py-1 text-xs rounded ${
                        category.isActive
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      title={
                        category.isActive
                          ? "Click to deactivate"
                          : "Click to activate"
                      }
                    >
                      {category.isActive ? "Active" : "Inactive"}
                    </button>
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-1 text-gray-400 hover:text-amber-600"
                      title="Edit"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ show: true, category })}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>

      {/* Delete Confirmation Overlay */}
      {deleteConfirm.show && deleteConfirm.category && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div
            className="fixed inset-0 backdrop-blur-sm bg-white/30"
            onClick={() => setDeleteConfirm({ show: false, category: null })}
          />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Category
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete &quot;
                {deleteConfirm.category.name}
                &quot;? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() =>
                    setDeleteConfirm({ show: false, category: null })
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
    </div>
  );
}
