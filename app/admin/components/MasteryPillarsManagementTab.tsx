"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

interface MasteryPillar {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

const ICON_OPTIONS = [
  { value: "leaf", label: "Leaf (Sustainability)" },
  { value: "cog", label: "Cog (Engineering)" },
  { value: "hand", label: "Hand (Craftsmanship)" },
  { value: "hammer", label: "Hammer (Building)" },
  { value: "tree", label: "Tree (Nature)" },
  { value: "star", label: "Star (Excellence)" },
  { value: "heart", label: "Heart (Passion)" },
  { value: "shield", label: "Shield (Quality)" },
  { value: "clock", label: "Clock (Timeless)" },
  { value: "gem", label: "Gem (Premium)" },
];

export default function MasteryPillarsManagementTab() {
  const [pillars, setPillars] = useState<MasteryPillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon: "leaf",
    order: 1,
    isActive: true,
  });
  const { showToast } = useToast();

  const token =
    typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

  const fetchPillars = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/mastery-pillars`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setPillars(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching mastery pillars:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchPillars();
    }
  }, [token, fetchPillars]);

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
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
            ? parseInt(value) || 0
            : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      showToast({
        type: "warning",
        title: "Validation",
        message: "Title and description are required",
      });
      return;
    }

    try {
      const url = editingId
        ? `${API_URL}/api/admin/mastery-pillars/${editingId}`
        : `${API_URL}/api/admin/mastery-pillars`;

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
          title: editingId ? "Pillar Updated" : "Pillar Created",
          message: editingId
            ? "Mastery pillar updated successfully!"
            : "Mastery pillar created successfully!",
        });
        resetForm();
        setView("list");
        fetchPillars();
      } else {
        showToast({
          type: "error",
          title: "Error",
          message: data.message || "Failed to save pillar",
        });
      }
    } catch (error) {
      console.error("Error submitting mastery pillar:", error);
      showToast({
        type: "error",
        title: "Submit Failed",
        message: "Failed to submit mastery pillar",
      });
    }
  };

  const handleEdit = (pillar: MasteryPillar) => {
    setFormData({
      title: pillar.title,
      description: pillar.description,
      icon: pillar.icon,
      order: pillar.order,
      isActive: pillar.isActive,
    });
    setEditingId(pillar.id);
    setView("edit");
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete mastery pillar "${title}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(
        `${API_URL}/api/admin/mastery-pillars/${id}`,
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
          title: "Pillar Deleted",
          message: "Mastery pillar deleted successfully!",
        });
        fetchPillars();
      } else {
        showToast({
          type: "error",
          title: "Delete Failed",
          message: data.message || "Failed to delete",
        });
      }
    } catch (error) {
      console.error("Error deleting mastery pillar:", error);
      showToast({
        type: "error",
        title: "Delete Error",
        message: "Failed to delete mastery pillar",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (pillar: MasteryPillar) => {
    try {
      const response = await fetch(
        `${API_URL}/api/admin/mastery-pillars/${pillar.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isActive: !pillar.isActive }),
        },
      );

      const data = await response.json();

      if (data.success) {
        fetchPillars();
      } else {
        showToast({
          type: "error",
          title: "Toggle Failed",
          message: data.message || "Failed to toggle status",
        });
      }
    } catch (error) {
      console.error("Error toggling pillar status:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      icon: "leaf",
      order: pillars.length + 1,
      isActive: true,
    });
    setEditingId(null);
  };

  const getIconEmoji = (iconName: string) => {
    const icon = ICON_OPTIONS.find((i) => i.value === iconName);
    return icon ? icon.label.split(" ")[0] : "Leaf";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="p-6">
      {/* LIST VIEW */}
      {view === "list" && (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold text-[#3e2723]">
                Mastery Pillars ({pillars.length})
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                These cards appear on the homepage and mastery page
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setView("create");
              }}
              className="px-4 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition duration-300"
            >
              + Add Pillar
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg p-8 shadow-lg border border-[#d7ccc8] text-center">
              <p className="text-gray-600">Loading mastery pillars...</p>
            </div>
          ) : pillars.length === 0 ? (
            <div className="bg-white rounded-lg p-8 shadow-lg border border-[#d7ccc8] text-center">
              <p className="text-gray-600 mb-4">No mastery pillars yet</p>
              <p className="text-sm text-gray-500 mb-4">
                Default pillars will be shown on the website until you create
                custom ones.
              </p>
              <button
                onClick={() => {
                  resetForm();
                  setView("create");
                }}
                className="inline-block px-4 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723]"
              >
                Create First Pillar
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cards Grid Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {pillars
                  .filter((p) => p.isActive)
                  .sort((a, b) => a.order - b.order)
                  .slice(0, 3)
                  .map((pillar) => (
                    <div
                      key={pillar.id}
                      className="bg-white rounded-lg p-6 shadow border border-[#d7ccc8] text-center"
                    >
                      <span className="text-4xl mb-3 block">
                        {getIconEmoji(pillar.icon)}
                      </span>
                      <h4 className="font-bold text-[#4e342e] mb-2">
                        {pillar.title}
                      </h4>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {pillar.description}
                      </p>
                    </div>
                  ))}
              </div>

              {/* Table */}
              <div className="bg-white rounded-lg shadow-lg border border-[#d7ccc8] overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-[#d7ccc8] bg-[#fcfaf6]">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold">
                        Order
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">
                        Icon
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">
                        Title
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">
                        Description
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">
                        Created
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pillars
                      .sort((a, b) => a.order - b.order)
                      .map((pillar) => (
                        <tr
                          key={pillar.id}
                          className={`border-b border-[#d7ccc8]/50 hover:bg-[#fcfaf6] transition duration-200 ${
                            !pillar.isActive ? "opacity-50" : ""
                          }`}
                        >
                          <td className="py-3 px-4 text-sm font-medium">
                            #{pillar.order}
                          </td>
                          <td className="py-3 px-4 text-2xl">
                            {getIconEmoji(pillar.icon)}
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-[#4e342e]">
                            {pillar.title}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                            {pillar.description.length > 60
                              ? pillar.description.substring(0, 60) + "..."
                              : pillar.description}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <button
                              onClick={() => handleToggleActive(pillar)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                pillar.isActive
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {pillar.isActive ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {formatDate(pillar.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(pillar)}
                                className="text-[#4e342e] hover:text-[#3e2723] hover:underline font-semibold"
                              >
                                Edit
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() =>
                                  handleDelete(pillar.id, pillar.title)
                                }
                                disabled={deletingId === pillar.id}
                                className={`${
                                  deletingId === pillar.id
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "text-red-600 hover:text-red-700 hover:underline"
                                } font-semibold`}
                              >
                                {deletingId === pillar.id
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
            </div>
          )}
        </>
      )}

      {/* CREATE/EDIT FORM */}
      {(view === "create" || view === "edit") && (
        <div className="bg-white rounded-lg shadow-lg border border-[#d7ccc8] p-8 max-w-2xl">
          <h3 className="text-2xl font-serif font-bold text-[#3e2723] mb-6">
            {editingId ? "Edit Mastery Pillar" : "Add New Mastery Pillar"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Sustainable Sourcing"
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg text-[#3e2723] focus:ring-[#4e342e] focus:border-[#4e342e]"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe this pillar of mastery..."
                rows={4}
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg text-[#3e2723] focus:ring-[#4e342e] focus:border-[#4e342e]"
                required
              />
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                Icon
              </label>
              <select
                name="icon"
                value={formData.icon}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg text-[#3e2723] focus:ring-[#4e342e] focus:border-[#4e342e]"
              >
                {ICON_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Order */}
            <div>
              <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                Display Order
              </label>
              <input
                type="number"
                name="order"
                value={formData.order}
                onChange={handleInputChange}
                min="1"
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg text-[#3e2723] focus:ring-[#4e342e] focus:border-[#4e342e]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Lower numbers appear first on the page
              </p>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="w-5 h-5 rounded border-[#d7ccc8] text-[#4e342e] focus:ring-[#4e342e]"
              />
              <label
                htmlFor="isActive"
                className="text-sm font-semibold text-[#3e2723]"
              >
                Active (visible on website)
              </label>
            </div>

            {/* Preview */}
            <div className="border-t border-[#d7ccc8] pt-6">
              <h4 className="text-sm font-semibold text-[#3e2723] mb-3">
                Preview
              </h4>
              <div className="bg-[#fcfaf6] rounded-lg p-6 text-center max-w-sm">
                <span className="text-4xl mb-3 block">
                  {getIconEmoji(formData.icon)}
                </span>
                <h5 className="font-bold text-[#4e342e] mb-2">
                  {formData.title || "Pillar Title"}
                </h5>
                <p className="text-sm text-gray-600">
                  {formData.description ||
                    "Pillar description will appear here..."}
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition duration-300 font-semibold"
              >
                {editingId ? "Update Pillar" : "Create Pillar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setView("list");
                }}
                className="px-6 py-2 border border-[#d7ccc8] text-[#3e2723] rounded-lg hover:bg-[#fcfaf6] transition duration-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
