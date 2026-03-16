"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import CategoryManagementModal from "./CategoryManagementModal";

const API_URL = "";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  projectType: string;
  budget?: string;
  timeline?: string;
  message: string;
  status: "new" | "read" | "responded" | "closed";
  notes?: string;
  createdAt: string;
}

export default function InquiriesManagementTab() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [filteredInquiries, setFilteredInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [view, setView] = useState<"list" | "detail">("list");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Inquiry["status"]>("new");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    id: string;
    name: string;
  }>({ show: false, id: "", name: "" });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const { showToast } = useToast();

  const token =
    typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

  // Fetch inquiries on mount and when filter changes
  useEffect(() => {
    fetchInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filterStatus]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/api/admin/inquiries`;
      if (filterStatus !== "all") {
        url += `?status=${encodeURIComponent(filterStatus)}`;
      }

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setInquiries(data.data || []);
        setFilteredInquiries(data.data || []);
      } else {
        console.error("Failed to fetch inquiries:", data.message);
      }
    } catch (error) {
      console.error("Error fetching inquiries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInquiry = async (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setNotes(inquiry.notes || "");
    setStatus(inquiry.status);
    setView("detail");
  };

  const handleUpdateInquiry = async () => {
    if (!selectedInquiry) return;

    try {
      const response = await fetch(
        `${API_URL}/api/admin/inquiries/${selectedInquiry.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
            notes,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        // Update local state
        setInquiries((prev) =>
          prev.map((inq) =>
            inq.id === selectedInquiry.id ? { ...inq, status, notes } : inq,
          ),
        );
        setSelectedInquiry(null);
        setView("list");
        showToast({
          type: "success",
          title: "Inquiry Updated",
          message: "Inquiry updated successfully!",
        });
        fetchInquiries();
      } else {
        showToast({
          type: "error",
          title: "Update Failed",
          message: data.message || "Failed to update inquiry",
        });
      }
    } catch (error) {
      console.error("Error updating inquiry:", error);
      showToast({
        type: "error",
        title: "Update Error",
        message: "Error updating inquiry",
      });
    }
  };

  const handleDeleteInquiry = async () => {
    try {
      setDeletingId(deleteConfirm.id);
      const response = await fetch(
        `${API_URL}/api/admin/inquiries/${deleteConfirm.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (data.success) {
        setInquiries((prev) =>
          prev.filter((inq) => inq.id !== deleteConfirm.id),
        );
        showToast({
          type: "success",
          title: "Inquiry Deleted",
          message: "Inquiry deleted successfully!",
        });
      } else {
        showToast({
          type: "error",
          title: "Delete Failed",
          message: data.message || "Failed to delete inquiry",
        });
      }
    } catch (error) {
      console.error("Error deleting inquiry:", error);
      showToast({
        type: "error",
        title: "Delete Error",
        message: "Error deleting inquiry",
      });
    } finally {
      setDeletingId(null);
      setDeleteConfirm({ show: false, id: "", name: "" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-red-100 text-red-700";
      case "read":
        return "bg-yellow-100 text-yellow-700";
      case "responded":
        return "bg-blue-100 text-blue-700";
      case "closed":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getProjectTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      furniture: "Custom Furniture",
      architectural: "Architectural Millwork",
      interiors: "Interior Design",
      restoration: "Restoration",
      marine: "Marine Joinery",
      other: "Other",
    };
    return labels[type] || type;
  };

  return (
    <div className="p-6">
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
                Delete Inquiry
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete the inquiry from &quot;
                {deleteConfirm.name}
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
                  onClick={handleDeleteInquiry}
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
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-semibold text-[#3e2723]">
                Inquiries ({inquiries.length})
              </h3>
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
            </div>
            <div className="flex gap-2">
              {["all", "new", "read", "responded", "closed"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition duration-300 ${
                    filterStatus === s
                      ? "bg-[#4e342e] text-white"
                      : "bg-[#fcfaf6] border border-[#d7ccc8] text-[#3e2723] hover:bg-[#4e342e]/5"
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg p-8 shadow-lg border border-[#d7ccc8] text-center">
              <p className="text-gray-600">Loading inquiries...</p>
            </div>
          ) : filteredInquiries.length === 0 ? (
            <div className="bg-white rounded-lg p-8 shadow-lg border border-[#d7ccc8] text-center">
              <p className="text-gray-600">No inquiries found</p>
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
                      Email
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">
                      Project Type
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInquiries.map((inquiry) => (
                    <tr
                      key={inquiry.id}
                      className="border-b border-[#d7ccc8]/50 hover:bg-[#fcfaf6] transition duration-200"
                    >
                      <td className="py-3 px-4 text-sm font-medium">
                        {inquiry.name}
                      </td>
                      <td className="py-3 px-4 text-sm text-blue-600 hover:underline">
                        <a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {getProjectTypeLabel(inquiry.projectType)}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            inquiry.status,
                          )}`}
                        >
                          {inquiry.status.charAt(0).toUpperCase() +
                            inquiry.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(inquiry.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm space-x-2">
                        <button
                          onClick={() => handleSelectInquiry(inquiry)}
                          className="text-[#4e342e] hover:text-[#3e2723] hover:underline font-semibold"
                        >
                          View
                        </button>
                        {" | "}
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              show: true,
                              id: inquiry.id,
                              name: inquiry.name,
                            })
                          }
                          disabled={deletingId === inquiry.id}
                          className={`${
                            deletingId === inquiry.id
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-red-600 hover:text-red-700 hover:underline"
                          }`}
                        >
                          {deletingId === inquiry.id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* DETAIL VIEW */}
      {view === "detail" && selectedInquiry && (
        <div className="bg-white rounded-lg shadow-lg border border-[#d7ccc8] p-8 max-w-3xl">
          <button
            onClick={() => setView("list")}
            className="mb-6 text-[#4e342e] hover:text-[#3e2723] font-semibold"
          >
            ← Back to List
          </button>

          <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-[#d7ccc8] pb-4">
              <h2 className="text-2xl font-serif font-bold text-[#3e2723] mb-2">
                {selectedInquiry.name}
              </h2>
              <p className="text-gray-600 text-sm mb-3">
                Submitted on{" "}
                {new Date(selectedInquiry.createdAt).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </p>
              <div className="flex gap-4 items-center">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                    selectedInquiry.status,
                  )}`}
                >
                  {selectedInquiry.status.charAt(0).toUpperCase() +
                    selectedInquiry.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                  Email
                </label>
                <a
                  href={`mailto:${selectedInquiry.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {selectedInquiry.email}
                </a>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                  Phone
                </label>
                <p className="text-gray-600">
                  {selectedInquiry.phone || "Not provided"}
                </p>
              </div>
            </div>

            {/* Project Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                  Project Type
                </label>
                <p className="text-gray-600">
                  {getProjectTypeLabel(selectedInquiry.projectType)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                  Budget
                </label>
                <p className="text-gray-600">
                  {selectedInquiry.budget || "Not specified"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                  Timeline
                </label>
                <p className="text-gray-600">
                  {selectedInquiry.timeline || "Not specified"}
                </p>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                Project Description
              </label>
              <div className="bg-[#fcfaf6] rounded-lg p-4 border border-[#d7ccc8]">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedInquiry.message}
                </p>
              </div>
            </div>

            {/* Status Update */}
            <div className="border-t border-[#d7ccc8] pt-6">
              <h3 className="text-lg font-semibold text-[#3e2723] mb-4">
                Update Inquiry
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as Inquiry["status"])
                    }
                    className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg text-[#3e2723] focus:ring-[#4e342e] focus:border-[#4e342e]"
                  >
                    <option value="new">New</option>
                    <option value="read">Read</option>
                    <option value="responded">Responded</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                    Internal Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg text-[#3e2723] focus:ring-[#4e342e] focus:border-[#4e342e]"
                    placeholder="Add notes about this inquiry (visible only to admin)..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleUpdateInquiry}
                    className="px-6 py-2 bg-[#4e342e] text-white font-semibold rounded-lg hover:bg-[#3e2723] transition duration-300"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setView("list")}
                    className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      <CategoryManagementModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        type="inquiry"
      />
    </div>
  );
}
