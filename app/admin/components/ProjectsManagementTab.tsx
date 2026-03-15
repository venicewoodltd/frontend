"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import CategoryManagementModal from "./CategoryManagementModal";

interface ProjectCreator {
  id: string;
  username: string;
  name?: string;
  role?: string;
}

interface Project {
  id: string;
  name: string;
  title: string;
  slug?: string;
  category: string;
  featured: boolean;
  status?: "draft" | "published";
  views?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  createdByUser?: ProjectCreator;
}

const API_URL = "";

// Helper function to safely format dates
const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return "-";

    const dateStr = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timeStr = date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dateStr} ${timeStr}`;
  } catch {
    return "-";
  }
};

export default function ProjectsManagementTab() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    id: string;
    name: string;
  }>({ show: false, id: "", name: "" });
  const [filterStatus, setFilterStatus] = useState("all");
  const [token, setToken] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const authToken = localStorage.getItem("adminToken");
    if (!authToken) {
      router.push("/admin/login");
      return;
    }
    setToken(authToken);
  }, [router]);

  // Fetch projects on component mount and when filter changes
  useEffect(() => {
    const fetchProjects = async () => {
      if (!token) return;

      try {
        setLoadingProjects(true);
        const queryParams = new URLSearchParams();
        queryParams.append("limit", "100");
        if (filterStatus !== "all") {
          queryParams.append("status", filterStatus);
        }

        const response = await fetch(
          `${API_URL}/api/admin/projects?${queryParams}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (data.success) {
          setProjects(data.projects || data.data || []);
        } else {
          console.error(
            "Failed to fetch projects:",
            data.error || data.message || "Unknown error",
          );
          setProjects([]);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [token, filterStatus]);

  const handleDeleteProject = async () => {
    try {
      setDeletingId(deleteConfirm.id);
      const response = await fetch(
        `${API_URL}/api/admin/projects/${deleteConfirm.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (data.success) {
        // Remove from UI
        setProjects(projects.filter((p) => p.id !== deleteConfirm.id));
        showToast({
          type: "success",
          title: "Project Deleted",
          message: `"${deleteConfirm.name}" has been deleted successfully.`,
        });
      } else {
        showToast({
          type: "error",
          title: "Delete Failed",
          message: data.message || "Unknown error",
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      showToast({
        type: "error",
        title: "Delete Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setDeletingId(null);
      setDeleteConfirm({ show: false, id: "", name: "" });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-[#3e2723]">
          Projects Management
        </h3>
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
          <a
            href="/admin/create-project"
            className="px-4 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition duration-300"
          >
            + New Project
          </a>
        </div>
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
                Delete Project
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
                  onClick={handleDeleteProject}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-300 ${
            filterStatus === "all"
              ? "bg-[#4e342e] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterStatus("draft")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-300 ${
            filterStatus === "draft"
              ? "bg-[#4e342e] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Draft
        </button>
        <button
          onClick={() => setFilterStatus("published")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-300 ${
            filterStatus === "published"
              ? "bg-[#4e342e] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Published
        </button>
      </div>

      {loadingProjects ? (
        <div className="bg-white rounded-lg p-8 shadow-lg border border-[#d7ccc8] text-center">
          <p className="text-gray-600">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-lg p-8 shadow-lg border border-[#d7ccc8] text-center">
          <p className="text-gray-600 mb-4">
            {filterStatus === "all"
              ? "No projects yet"
              : `No ${filterStatus} projects`}
          </p>
          <a
            href="/admin/create-project"
            className="inline-block px-4 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition duration-300"
          >
            Create First Project
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg border border-[#d7ccc8] overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[#d7ccc8]">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Project Name
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Category
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Author
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Featured
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Views
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
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="border-b border-[#d7ccc8]/50 hover:bg-[#fcfaf6] transition duration-200"
                >
                  <td className="py-3 px-4 text-sm font-medium">
                    {project.name}
                  </td>
                  <td className="py-3 px-4 text-sm">{project.category}</td>
                  <td className="py-3 px-4 text-sm">
                    {project.createdByUser ? (
                      <span className="text-gray-700">
                        {project.createdByUser.name ||
                          project.createdByUser.username}
                        {project.createdByUser.role && (
                          <span className="ml-1 text-xs text-gray-500">
                            ({project.createdByUser.role})
                          </span>
                        )}
                      </span>
                    ) : project.createdBy ? (
                      <span className="text-gray-500 italic text-xs">
                        {project.createdBy.substring(0, 8)}...
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Unknown</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        project.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {project.status === "published" ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        project.featured
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {project.featured ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {project.views || 0}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    <span title={project.updatedAt || project.createdAt || ""}>
                      {formatDate(project.updatedAt || project.createdAt)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <a
                      href={`/projects/${project.slug || project.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      View
                    </a>
                    {" | "}
                    <a
                      href={`/admin/edit-project?id=${project.id}`}
                      className="text-[#4e342e] hover:text-[#3e2723] hover:underline"
                    >
                      Edit
                    </a>
                    {" | "}
                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          show: true,
                          id: project.id,
                          name: project.name,
                        })
                      }
                      disabled={deletingId === project.id}
                      className={`${
                        deletingId === project.id
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-red-600 hover:text-red-700 hover:underline"
                      }`}
                    >
                      {deletingId === project.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Category Management Modal */}
      <CategoryManagementModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        type="project"
      />
    </div>
  );
}
