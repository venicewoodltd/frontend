"use client";

import { useState, useEffect, useCallback } from "react";
import WYSIWYGEditor from "@/components/ui/WYSIWYGEditor";
import { sanitizeHTML } from "@/lib/sanitize";
import CircularProgress from "@/components/ui/CircularProgress";
import { useToast } from "@/components/ui/Toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

interface MasteryContent {
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  history: string;
  yearsExperience: number;
  projectsCompleted: number;
  satisfiedClients: number;
}

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

type EditingSection = "hero" | "history" | "statistics" | null;

export default function MasteryManagementTab() {
  const [content, setContent] = useState<MasteryContent>({
    heroTitle: "The Art of Woodworking Mastery",
    heroSubtitle: "",
    heroImage: "",
    history: "",
    yearsExperience: 0,
    projectsCompleted: 0,
    satisfiedClients: 0,
  });
  const [editedContent, setEditedContent] = useState<MasteryContent>({
    ...content,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingSection, setEditingSection] = useState<EditingSection>(null);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { showToast } = useToast();

  const [pillars, setPillars] = useState<MasteryPillar[]>([]);
  const [pillarsLoading, setPillarsLoading] = useState(true);
  const [pillarView, setPillarView] = useState<"list" | "create" | "edit">(
    "list",
  );
  const [editingPillarId, setEditingPillarId] = useState<string | null>(null);
  const [deletingPillarId, setDeletingPillarId] = useState<string | null>(null);
  const [pillarFormData, setPillarFormData] = useState({
    title: "",
    description: "",
    icon: "leaf",
    order: 1,
    isActive: true,
  });

  const adminToken =
    typeof window !== "undefined" ? localStorage.getItem("adminToken") : "";

  const mapContent = (data: Record<string, unknown>): MasteryContent => ({
    heroTitle: (data.heroTitle as string) || "",
    heroSubtitle: (data.heroSubtitle as string) || "",
    heroImage: (data.heroImage as string) || "",
    history: (data.history as string) || "",
    yearsExperience: (data.yearsExperience as number) || 0,
    projectsCompleted: (data.projectsCompleted as number) || 0,
    satisfiedClients: (data.satisfiedClients as number) || 0,
  });

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/api/admin/mastery`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch mastery content");
      const data = await response.json();
      if (data.success) {
        const mapped = mapContent(data.data);
        setContent(mapped);
        setEditedContent(mapped);
      }
    } catch (err) {
      setError(`Error loading mastery content: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchPillars = useCallback(async () => {
    try {
      setPillarsLoading(true);
      const response = await fetch(`${API_URL}/api/admin/mastery-pillars`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await response.json();
      if (data.success) setPillars(data.data || []);
    } catch (error) {
      console.error("Error fetching mastery pillars:", error);
    } finally {
      setPillarsLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    fetchContent();
    if (adminToken) fetchPillars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFieldChange = (field: string, value: string | number) => {
    setEditedContent((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(field);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("adminToken") : "";
      const data = await new Promise<{
        success: boolean;
        fileId?: string;
        error?: string;
        message?: string;
      }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        });
        xhr.addEventListener("load", () => {
          try {
            const response = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(response);
            } else {
              resolve({
                success: false,
                error:
                  response.error ||
                  response.message ||
                  `Upload failed (${xhr.status})`,
              });
            }
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });
        xhr.addEventListener("error", () =>
          reject(new Error("Network error during upload")),
        );
        xhr.open("POST", `${API_URL}/api/images/image`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.send(formData);
      });
      if (data.success && data.fileId) {
        handleFieldChange(field, `${API_URL}/api/images/${data.fileId}`);
        setSuccess("Image uploaded successfully!");
        showToast({
          type: "success",
          title: "Image Uploaded",
          message: "Image uploaded successfully!",
        });
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errMsg = data.error || data.message || "Failed to upload image";
        setError(errMsg);
        showToast({
          type: "error",
          title: "Upload Failed",
          message: errMsg,
        });
      }
    } catch (err) {
      setError(`Error uploading image: ${(err as Error).message}`);
      showToast({
        type: "error",
        title: "Upload Error",
        message: (err as Error).message,
      });
    } finally {
      setUploadingImage(null);
      setUploadProgress(0);
    }
  };

  const handleSaveSection = async (section: EditingSection) => {
    if (!section) return;
    try {
      setSaving(true);
      setError("");

      // Only send fields for this section
      let payload: Record<string, unknown> = {};
      if (section === "hero") {
        payload = {
          heroTitle: editedContent.heroTitle,
          heroSubtitle: editedContent.heroSubtitle,
          heroImage: editedContent.heroImage,
        };
      } else if (section === "history") {
        payload = { history: editedContent.history };
      } else if (section === "statistics") {
        payload = {
          yearsExperience: editedContent.yearsExperience,
          projectsCompleted: editedContent.projectsCompleted,
          satisfiedClients: editedContent.satisfiedClients,
        };
      }

      const response = await fetch(`${API_URL}/api/admin/mastery`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        const mapped = mapContent(data.data);
        setContent(mapped);
        setEditedContent(mapped);
        setSuccess(
          `${section.charAt(0).toUpperCase() + section.slice(1)} saved successfully!`,
        );
        showToast({
          type: "success",
          title: "Content Saved",
          message: `${section.charAt(0).toUpperCase() + section.slice(1)} saved successfully!`,
        });
        setEditingSection(null);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to save content");
        showToast({
          type: "error",
          title: "Save Failed",
          message: data.message || "Failed to save content",
        });
      }
    } catch (err) {
      setError(`Error saving content: ${(err as Error).message}`);
      showToast({
        type: "error",
        title: "Save Error",
        message: (err as Error).message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSection = () => {
    setEditedContent({ ...content });
    setEditingSection(null);
    setError("");
  };

  const startEditSection = (section: EditingSection) => {
    setEditedContent({ ...content });
    setEditingSection(section);
    setError("");
    setSuccess("");
  };

  // --- Pillar handlers ---
  const handlePillarInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setPillarFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
            ? parseInt(value) || 0
            : value,
    }));
  };

  const handlePillarSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pillarFormData.title.trim() || !pillarFormData.description.trim()) {
      showToast({
        type: "warning",
        title: "Validation",
        message: "Title and description are required",
      });
      return;
    }
    try {
      const url = editingPillarId
        ? `${API_URL}/api/admin/mastery-pillars/${editingPillarId}`
        : `${API_URL}/api/admin/mastery-pillars`;
      const response = await fetch(url, {
        method: editingPillarId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(pillarFormData),
      });
      const data = await response.json();
      if (data.success) {
        showToast({
          type: "success",
          title: editingPillarId ? "Pillar Updated" : "Pillar Created",
          message: editingPillarId
            ? "Mastery pillar updated!"
            : "Mastery pillar created!",
        });
        resetPillarForm();
        setPillarView("list");
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

  const handlePillarEdit = (pillar: MasteryPillar) => {
    setPillarFormData({
      title: pillar.title,
      description: pillar.description,
      icon: pillar.icon,
      order: pillar.order,
      isActive: pillar.isActive,
    });
    setEditingPillarId(pillar.id);
    setPillarView("edit");
  };

  const handlePillarDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete mastery pillar "${title}"?`)) return;
    try {
      setDeletingPillarId(id);
      const response = await fetch(
        `${API_URL}/api/admin/mastery-pillars/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );
      const data = await response.json();
      if (data.success) {
        showToast({
          type: "success",
          title: "Pillar Deleted",
          message: "Mastery pillar deleted!",
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
      setDeletingPillarId(null);
    }
  };

  const handleTogglePillarActive = async (pillar: MasteryPillar) => {
    try {
      const response = await fetch(
        `${API_URL}/api/admin/mastery-pillars/${pillar.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ isActive: !pillar.isActive }),
        },
      );
      const data = await response.json();
      if (data.success) fetchPillars();
      else
        showToast({
          type: "error",
          title: "Toggle Failed",
          message: data.message || "Failed to toggle status",
        });
    } catch (error) {
      console.error("Error toggling pillar status:", error);
    }
  };

  const resetPillarForm = () => {
    setPillarFormData({
      title: "",
      description: "",
      icon: "leaf",
      order: pillars.length + 1,
      isActive: true,
    });
    setEditingPillarId(null);
  };

  const getIconEmoji = (iconName: string) => {
    const iconMap: Record<string, string> = {
      leaf: "\u{1F33F}",
      cog: "\u{2699}\u{FE0F}",
      hand: "\u{270B}",
      hammer: "\u{1F528}",
      tree: "\u{1F333}",
      star: "\u{2B50}",
      heart: "\u{2764}\u{FE0F}",
      shield: "\u{1F6E1}\u{FE0F}",
      clock: "\u{1F552}",
      gem: "\u{1F48E}",
    };
    return iconMap[iconName] || "\u{1F33F}";
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const SectionHeader = ({
    title,
    section,
    children,
  }: {
    title: string;
    section: EditingSection;
    children?: React.ReactNode;
  }) => (
    <div className="flex justify-between items-center mb-4">
      <h4 className="text-lg font-semibold text-[#4e342e]">{title}</h4>
      <div className="flex items-center gap-2">
        {children}
        {editingSection === section ? (
          <>
            <button
              onClick={handleCancelSection}
              className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSaveSection(section)}
              disabled={saving}
              className="px-4 py-1.5 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] disabled:opacity-50 text-sm"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </>
        ) : (
          <button
            onClick={() => startEditSection(section)}
            disabled={editingSection !== null}
            className="px-4 py-1.5 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] disabled:opacity-30 text-sm"
          >
            Edit Content
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg p-8 shadow-lg border border-[#d7ccc8] text-center">
          <p className="text-gray-600">Loading mastery content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-xl font-semibold text-[#3e2723] mb-6">
        Mastery Page Content
      </h3>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="space-y-6">
        {/* Hero Section */}
        <div className="bg-white rounded-lg p-6 shadow-lg border border-[#d7ccc8]">
          <SectionHeader title="Hero Section" section="hero" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hero Title
              </label>
              {editingSection === "hero" ? (
                <input
                  type="text"
                  value={editedContent.heroTitle}
                  onChange={(e) =>
                    handleFieldChange("heroTitle", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4e342e] focus:border-transparent"
                />
              ) : (
                <p className="text-gray-800">
                  {content.heroTitle || (
                    <span className="text-gray-400 italic">Not set</span>
                  )}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hero Image
              </label>
              {editingSection === "hero" ? (
                <div className="space-y-3">
                  {/* Current/Uploaded preview */}
                  {(editedContent.heroImage || content.heroImage) && (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-[#d7ccc8] bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={editedContent.heroImage || content.heroImage}
                        alt="Hero preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  {/* Upload zone */}
                  <label
                    className={`flex items-center justify-center px-4 py-4 border-2 border-dashed rounded-lg cursor-pointer transition ${
                      uploadingImage === "heroImage"
                        ? "border-[#4e342e] bg-[#faf5f0]"
                        : "border-[#d7ccc8] hover:border-[#4e342e] hover:bg-[#fcfaf6]"
                    }`}
                  >
                    {uploadingImage === "heroImage" ? (
                      <div className="flex items-center gap-3">
                        <CircularProgress
                          progress={uploadProgress}
                          size={36}
                          strokeWidth={3}
                        />
                        <span className="text-sm text-[#4e342e] font-medium">
                          Uploading... {uploadProgress}%
                        </span>
                      </div>
                    ) : (
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
                          Click to select or drag image
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          JPG, PNG, or WebP
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "heroImage")}
                      disabled={uploadingImage === "heroImage"}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : content.heroImage ? (
                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-[#d7ccc8]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={content.heroImage}
                    alt="Hero"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <span className="text-gray-400 italic text-sm">No image</span>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hero Subtitle
              </label>
              {editingSection === "hero" ? (
                <textarea
                  value={editedContent.heroSubtitle}
                  onChange={(e) =>
                    handleFieldChange("heroSubtitle", e.target.value)
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4e342e] focus:border-transparent"
                />
              ) : (
                <p className="text-gray-800">
                  {content.heroSubtitle || (
                    <span className="text-gray-400 italic">Not set</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* History Section (WYSIWYG) */}
        <div className="bg-white rounded-lg p-6 shadow-lg border border-[#d7ccc8]">
          <SectionHeader title="History Section" section="history" />
          <p className="text-sm text-gray-500 mb-3">
            Rich text content that appears on the mastery page as your company
            history.
          </p>
          {editingSection === "history" ? (
            <WYSIWYGEditor
              value={editedContent.history}
              onChange={(html) => handleFieldChange("history", html)}
              placeholder="Write your company history here..."
              minHeight="350px"
            />
          ) : content.history ? (
            <div
              className="prose max-w-none text-gray-800 wysiwyg-content border border-gray-200 rounded-lg p-4"
              dangerouslySetInnerHTML={{
                __html: sanitizeHTML(content.history),
              }}
            />
          ) : (
            <p className="text-gray-400 italic">
              No history content yet. Click &quot;Edit Content&quot; to add your
              company history.
            </p>
          )}
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-lg p-6 shadow-lg border border-[#d7ccc8]">
          <SectionHeader title="Statistics" section="statistics" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Years of Experience
              </label>
              {editingSection === "statistics" ? (
                <input
                  type="number"
                  value={editedContent.yearsExperience}
                  onChange={(e) =>
                    handleFieldChange("yearsExperience", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              ) : (
                <p className="text-2xl font-bold text-[#4e342e]">
                  {content.yearsExperience}+
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Projects Completed
              </label>
              {editingSection === "statistics" ? (
                <input
                  type="number"
                  value={editedContent.projectsCompleted}
                  onChange={(e) =>
                    handleFieldChange(
                      "projectsCompleted",
                      Number(e.target.value),
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              ) : (
                <p className="text-2xl font-bold text-[#4e342e]">
                  {content.projectsCompleted}+
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Satisfied Clients
              </label>
              {editingSection === "statistics" ? (
                <input
                  type="number"
                  value={editedContent.satisfiedClients}
                  onChange={(e) =>
                    handleFieldChange(
                      "satisfiedClients",
                      Number(e.target.value),
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              ) : (
                <p className="text-2xl font-bold text-[#4e342e]">
                  {content.satisfiedClients}+
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Mastery Pillars */}
        <div className="bg-white rounded-lg p-6 shadow-lg border border-[#d7ccc8]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-lg font-semibold text-[#4e342e]">
                Mastery Pillars ({pillars.length})
              </h4>
              <p className="text-sm text-gray-500 mt-1">
                These cards appear on the homepage and mastery page
              </p>
            </div>
            {pillarView === "list" && (
              <button
                onClick={() => {
                  resetPillarForm();
                  setPillarView("create");
                }}
                className="px-4 py-1.5 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition duration-300 text-sm"
              >
                + Add Pillar
              </button>
            )}
          </div>

          {pillarView === "list" && (
            <>
              {pillarsLoading ? (
                <p className="text-gray-600 text-center py-4">
                  Loading mastery pillars...
                </p>
              ) : pillars.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-600 mb-2">No mastery pillars yet</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Default pillars will be shown on the website until you
                    create custom ones.
                  </p>
                  <button
                    onClick={() => {
                      resetPillarForm();
                      setPillarView("create");
                    }}
                    className="inline-block px-4 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723]"
                  >
                    Create First Pillar
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {pillars
                      .filter((p) => p.isActive)
                      .sort((a, b) => a.order - b.order)
                      .slice(0, 3)
                      .map((pillar) => (
                        <div
                          key={pillar.id}
                          className="bg-[#fcfaf6] rounded-lg p-4 border border-[#d7ccc8] text-center"
                        >
                          <span className="text-3xl mb-2 block">
                            {getIconEmoji(pillar.icon)}
                          </span>
                          <h5 className="font-bold text-[#4e342e] mb-1 text-sm">
                            {pillar.title}
                          </h5>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {pillar.description}
                          </p>
                        </div>
                      ))}
                  </div>
                  <div className="overflow-x-auto">
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
                              className={`border-b border-[#d7ccc8]/50 hover:bg-[#fcfaf6] transition duration-200 ${!pillar.isActive ? "opacity-50" : ""}`}
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
                                  onClick={() =>
                                    handleTogglePillarActive(pillar)
                                  }
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${pillar.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
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
                                    onClick={() => handlePillarEdit(pillar)}
                                    className="text-[#4e342e] hover:text-[#3e2723] hover:underline font-semibold"
                                  >
                                    Edit
                                  </button>
                                  <span className="text-gray-300">|</span>
                                  <button
                                    onClick={() =>
                                      handlePillarDelete(
                                        pillar.id,
                                        pillar.title,
                                      )
                                    }
                                    disabled={deletingPillarId === pillar.id}
                                    className={`${deletingPillarId === pillar.id ? "text-gray-400 cursor-not-allowed" : "text-red-600 hover:text-red-700 hover:underline"} font-semibold`}
                                  >
                                    {deletingPillarId === pillar.id
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
                </>
              )}
            </>
          )}

          {(pillarView === "create" || pillarView === "edit") && (
            <div className="max-w-2xl">
              <h5 className="text-lg font-serif font-bold text-[#3e2723] mb-4">
                {editingPillarId
                  ? "Edit Mastery Pillar"
                  : "Add New Mastery Pillar"}
              </h5>
              <form onSubmit={handlePillarSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#3e2723] mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={pillarFormData.title}
                    onChange={handlePillarInputChange}
                    placeholder="e.g., Sustainable Sourcing"
                    className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg text-[#3e2723] focus:ring-[#4e342e] focus:border-[#4e342e]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#3e2723] mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={pillarFormData.description}
                    onChange={handlePillarInputChange}
                    placeholder="Describe this pillar of mastery..."
                    rows={3}
                    className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg text-[#3e2723] focus:ring-[#4e342e] focus:border-[#4e342e]"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#3e2723] mb-1">
                      Icon
                    </label>
                    <select
                      name="icon"
                      value={pillarFormData.icon}
                      onChange={handlePillarInputChange}
                      className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg text-[#3e2723] focus:ring-[#4e342e] focus:border-[#4e342e]"
                    >
                      {ICON_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#3e2723] mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      name="order"
                      value={pillarFormData.order}
                      onChange={handlePillarInputChange}
                      min="1"
                      className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg text-[#3e2723] focus:ring-[#4e342e] focus:border-[#4e342e]"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="isActive"
                    id="pillarIsActive"
                    checked={pillarFormData.isActive}
                    onChange={handlePillarInputChange}
                    className="w-5 h-5 rounded border-[#d7ccc8] text-[#4e342e] focus:ring-[#4e342e]"
                  />
                  <label
                    htmlFor="pillarIsActive"
                    className="text-sm font-semibold text-[#3e2723]"
                  >
                    Active (visible on website)
                  </label>
                </div>
                <div className="border-t border-[#d7ccc8] pt-4">
                  <p className="text-sm font-semibold text-[#3e2723] mb-2">
                    Preview
                  </p>
                  <div className="bg-[#fcfaf6] rounded-lg p-4 text-center max-w-xs">
                    <span className="text-3xl mb-2 block">
                      {getIconEmoji(pillarFormData.icon)}
                    </span>
                    <h5 className="font-bold text-[#4e342e] mb-1">
                      {pillarFormData.title || "Pillar Title"}
                    </h5>
                    <p className="text-sm text-gray-600">
                      {pillarFormData.description ||
                        "Pillar description will appear here..."}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition duration-300 font-semibold"
                  >
                    {editingPillarId ? "Update Pillar" : "Create Pillar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetPillarForm();
                      setPillarView("list");
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
      </div>
    </div>
  );
}
