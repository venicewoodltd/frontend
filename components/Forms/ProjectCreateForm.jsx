"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  uploadImageToGridFS,
  validateImageFile,
  deleteImageFromGridFS,
} from "@/lib/imageUploadService";
import { StandaloneToast } from "@/components/ui/Toast";
import CircularProgress from "@/components/ui/CircularProgress";
import ConfirmModal from "@/components/ui/ConfirmModal";
import LoadingDots from "@/components/ui/LoadingDots";
import ProjectPreviewModal from "@/components/ui/ProjectPreviewModal";
import CategoryCreateModal from "@/components/ui/CategoryCreateModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function ProjectCreateForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    longDescription: "",
    category: "furniture",
    primaryWood: "",
    client: "",
    featured: false,
    status: "draft",
    seoTags: "",
    mainImage: "",
    galleryImages: [],
    specifications: [],
    materials: [],
  });

  const [categories, setCategories] = useState([]);

  const [imagePreview, setImagePreview] = useState("");
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [galleryFileIds, setGalleryFileIds] = useState([]);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploadingMain, setIsUploadingMain] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSpecification, setNewSpecification] = useState({
    key: "",
    value: "",
  });
  const [newMaterial, setNewMaterial] = useState("");

  // Preview modal state
  const [showPreview, setShowPreview] = useState(false);

  // Category create modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({
    show: false,
    type: "success",
    title: "",
    message: "",
  });

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    type: "gallery",
    index: null,
  });

  const showToast = useCallback((type, title, message = "") => {
    setToast({ show: true, type, title, message });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  // Fetch categories function
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/categories?type=project`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
        // Set default category if available and no category is set yet
        if (data.categories.length > 0) {
          setFormData((prev) => {
            if (!prev.category) {
              return { ...prev, category: data.categories[0].name };
            }
            return prev;
          });
        }
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle new category created
  const handleCategoryCreated = useCallback(
    (newCategory) => {
      setCategories((prev) => [...prev, newCategory]);
      setFormData((prev) => ({ ...prev, category: newCategory.name }));
      showToast(
        "success",
        "Category Created",
        `"${newCategory.name}" has been created successfully!`,
      );
    },
    [showToast],
  );

  // Handle category select change
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    if (value === "__create_new__") {
      setShowCategoryModal(true);
    } else {
      setFormData((prev) => ({ ...prev, category: value }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle main image upload to GridFS
  const handleMainImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    const validation = validateImageFile(file);

    if (!validation.valid) {
      setError(validation.errors.join(", "));
      return;
    }

    try {
      setIsUploadingMain(true);
      console.log(
        `📤 Uploading main image: ${file.name} (${validation.fileSize})`,
      );

      // Show preview while uploading
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      const result = await uploadImageToGridFS(file, (progress) => {
        setUploadProgress((prev) => ({
          ...prev,
          main: progress,
        }));
      });

      console.log("🔍 Upload result:", result);

      if (result && result.success && result.fileId) {
        console.log(`✅ Main image uploaded. FileID: ${result.fileId}`);
        setFormData((prev) => ({
          ...prev,
          mainImage: result.fileId,
        }));
        setError("");
        showToast(
          "success",
          "Image Uploaded",
          "Main image uploaded successfully",
        );
      } else {
        throw new Error("Upload did not return a valid fileId");
      }
    } catch (err) {
      console.error("Main image upload error:", err);
      setError(`Image upload failed: ${err.message}`);
      showToast("error", "Upload Failed", err.message);
      setImagePreview("");
    } finally {
      setIsUploadingMain(false);
      setUploadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress.main;
        return newProgress;
      });
    }
  };

  // Handle gallery image uploads to GridFS
  const handleGalleryUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError("");
    const fileArray = Array.from(files);

    // Validate all files
    for (const file of fileArray) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(`File "${file.name}": ${validation.errors.join(", ")}`);
        return;
      }
    }

    try {
      setIsUploadingGallery(true);
      const newPreviews = [...galleryPreviews];
      const newGalleryImages = [...galleryFileIds];

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const key = `gallery-${Date.now()}-${i}`;

        console.log(`📤 Uploading gallery image: ${file.name}`);

        try {
          const result = await uploadImageToGridFS(file, (progress) => {
            setUploadProgress((prev) => ({
              ...prev,
              [key]: progress,
            }));
          });

          if (result.success) {
            // Use the fileId as preview (will be fetched from GridFS)
            newPreviews.push(result.fileId);
            newGalleryImages.push(result.fileId);
            console.log(`✅ Gallery image uploaded. FileID: ${result.fileId}`);
          }
        } catch (uploadErr) {
          console.error(
            `Gallery image upload error for ${file.name}:`,
            uploadErr,
          );
          setError(`Failed to upload ${file.name}: ${uploadErr.message}`);
          return;
        } finally {
          setUploadProgress((prev) => {
            const newProgress = { ...prev };
            delete newProgress[key];
            return newProgress;
          });
        }
      }

      setGalleryPreviews(newPreviews);
      setGalleryFileIds(newGalleryImages);
      setFormData((prev) => ({
        ...prev,
        galleryImages: newGalleryImages,
      }));
      setError("");
      showToast(
        "success",
        "Gallery Updated",
        `${fileArray.length} image(s) uploaded successfully`,
      );
    } finally {
      setIsUploadingGallery(false);
    }
  };

  // Remove gallery image with confirmation
  const handleRemoveGalleryImage = (index) => {
    setConfirmModal({ show: true, type: "gallery", index });
  };

  // Confirm gallery image removal
  const confirmRemoveGalleryImage = async () => {
    const index = confirmModal.index;
    const fileIdToDelete = galleryFileIds[index];

    // Delete from GridFS if fileId exists
    if (fileIdToDelete) {
      try {
        await deleteImageFromGridFS(fileIdToDelete);
        console.log("✅ Gallery image deleted from GridFS:", fileIdToDelete);
      } catch (err) {
        console.error("Failed to delete gallery image from GridFS:", err);
      }
    }

    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
    setGalleryFileIds((prev) => {
      const newIds = prev.filter((_, i) => i !== index);
      setFormData((prevForm) => ({
        ...prevForm,
        galleryImages: newIds,
      }));
      return newIds;
    });
    setConfirmModal({ show: false, type: "gallery", index: null });
    showToast("success", "Image Removed", "Gallery image removed successfully");
  };

  // Remove main image with confirmation
  const handleRemoveMainImage = () => {
    setConfirmModal({ show: true, type: "main", index: null });
  };

  // Confirm main image removal
  const confirmRemoveMainImage = async () => {
    const fileIdToDelete = formData.mainImage;

    // Delete from GridFS if fileId exists
    if (fileIdToDelete) {
      try {
        await deleteImageFromGridFS(fileIdToDelete);
        console.log("✅ Main image deleted from GridFS:", fileIdToDelete);
      } catch (err) {
        console.error("Failed to delete main image from GridFS:", err);
      }
    }

    setFormData((prev) => ({ ...prev, mainImage: "" }));
    setImagePreview("");
    setConfirmModal({ show: false, type: "main", index: null });
    showToast("success", "Image Removed", "Main image removed successfully");
  };

  // Add specification
  const addSpecification = () => {
    if (newSpecification.key.trim() && newSpecification.value.trim()) {
      setFormData((prev) => ({
        ...prev,
        specifications: [...prev.specifications, { ...newSpecification }],
      }));
      setNewSpecification({ key: "", value: "" });
    }
  };

  // Remove specification
  const removeSpecification = (index) => {
    setFormData((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  // Add material
  const addMaterial = () => {
    if (newMaterial.trim()) {
      setFormData((prev) => ({
        ...prev,
        materials: [...prev.materials, newMaterial],
      }));
      setNewMaterial("");
    }
  };

  // Remove material
  const removeMaterial = (index) => {
    setFormData((prev) => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setError("");

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error("Title is required");
      }
      if (!formData.mainImage) {
        throw new Error("Main image is required");
      }

      setIsSubmitting(true);
      const token = localStorage.getItem("adminToken");

      // Create FormData for multipart upload
      const submitFormData = new FormData();
      // Use title as the project name
      submitFormData.append("name", formData.title.trim());
      submitFormData.append("title", formData.title.trim());
      submitFormData.append("description", formData.description || "");
      submitFormData.append("longDescription", formData.longDescription || "");
      submitFormData.append("category", formData.category || "furniture");
      submitFormData.append("primaryWood", formData.primaryWood || "");
      submitFormData.append("client", formData.client || "");
      submitFormData.append("featured", String(formData.featured));
      submitFormData.append("status", formData.status || "draft");
      submitFormData.append("seoTags", formData.seoTags || "");
      submitFormData.append("mainImageFileId", formData.mainImage);

      // Add gallery image file IDs
      if (formData.galleryImages && formData.galleryImages.length > 0) {
        formData.galleryImages.forEach((fileId) => {
          submitFormData.append("galleryImageFileIds[]", fileId);
        });
      }

      // Add JSON fields
      if (formData.specifications.length > 0) {
        submitFormData.append(
          "specifications",
          JSON.stringify(formData.specifications),
        );
      }
      if (formData.materials.length > 0) {
        submitFormData.append("materials", JSON.stringify(formData.materials));
      }

      console.log("📤 SENDING TO API:", {
        title: formData.title,
        mainImage: formData.mainImage,
        galleryImages: formData.galleryImages,
      });

      const response = await fetch(`${API_URL}/api/admin/projects`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitFormData,
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setSuccessMessage("Project created successfully!");
        showToast(
          "success",
          "Project Created",
          "Your project has been created successfully!",
        );
        setTimeout(() => {
          router.push("/admin?tab=projects");
        }, 2000);
      } else {
        throw new Error(result.message || "Failed to create project");
      }
    } catch (err) {
      console.error("FRONTEND ERROR:", err.message);
      setError(err.message || "Failed to create project");
      showToast(
        "error",
        "Creation Failed",
        err.message || "Failed to create project",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfaf6] py-12 px-4">
      {/* Toast Notification */}
      <StandaloneToast
        show={toast.show}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={hideToast}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.show}
        onClose={() =>
          setConfirmModal({ show: false, type: "gallery", index: null })
        }
        onConfirm={
          confirmModal.type === "main"
            ? confirmRemoveMainImage
            : confirmRemoveGalleryImage
        }
        title={
          confirmModal.type === "main"
            ? "Remove Main Image"
            : "Remove Gallery Image"
        }
        message="Are you sure you want to remove this image? This action cannot be undone."
        confirmText="Remove"
        type="danger"
      />

      {/* Project Preview Modal */}
      <ProjectPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        project={{
          name: formData.title,
          title: formData.title,
          description: formData.description,
          longDescription: formData.longDescription,
          category: formData.category,
          primaryWood: formData.primaryWood,
          client: formData.client,
          mainImage: imagePreview || formData.mainImage,
          galleryImages:
            galleryPreviews.length > 0
              ? galleryPreviews
              : formData.galleryImages,
          featured: formData.featured,
          status: formData.status,
          specifications: formData.specifications,
          materials: formData.materials,
        }}
      />

      <div className="max-w-4xl mx-auto">
        {/* Header with Preview Button */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-serif font-bold text-[#4e342e] mb-2">
              Create New Project
            </h1>
            <p className="text-gray-600">
              Add a new project with images stored in MongoDB GridFS
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#4e342e] text-[#4e342e] rounded-lg hover:bg-[#4e342e] hover:text-white transition duration-300"
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Preview
          </button>
        </div>

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            ✓ {successMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            ✗ Error: {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-lg p-8 space-y-8"
        >
          {/* BASIC INFORMATION */}
          <div className="border-b border-[#d7ccc8] pb-6">
            <h2 className="text-2xl font-serif font-bold text-[#4e342e] mb-6">
              Basic Information
            </h2>

            <div className="mb-6">
              <label className="block text-[#3e2723] font-semibold mb-2">
                Project Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900 placeholder-gray-400"
                placeholder="e.g., Yacht Interior Restoration"
              />
            </div>

            <div className="mb-6">
              <label className="block text-[#3e2723] font-semibold mb-2">
                Short Description
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900 placeholder-gray-400"
                placeholder="e.g., A comprehensive yacht interior restoration project"
              />
            </div>

            <div className="mb-6">
              <label className="block text-[#3e2723] font-semibold mb-2">
                Long Description
              </label>
              <textarea
                name="longDescription"
                value={formData.longDescription}
                onChange={handleChange}
                rows="5"
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900 placeholder-gray-400"
                placeholder="Detailed project description, scope, challenges, and achievements..."
              />
            </div>

            <div className="grid grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-[#3e2723] font-semibold mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleCategoryChange}
                  className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900"
                >
                  {categories.length > 0 ? (
                    <>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                      <option
                        value="__create_new__"
                        className="text-[#4e342e] font-semibold"
                      >
                        + Create New Category
                      </option>
                    </>
                  ) : (
                    <>
                      <option value="">Select a category</option>
                      <option
                        value="__create_new__"
                        className="text-[#4e342e] font-semibold"
                      >
                        + Create New Category
                      </option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[#3e2723] font-semibold mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div className="flex items-center pt-7">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                    className="mr-2 h-5 w-5"
                  />
                  <span className="text-[#3e2723] font-semibold">Featured</span>
                </label>
              </div>
            </div>
          </div>

          {/* PROJECT DETAILS */}
          <div className="border-b border-[#d7ccc8] pb-6">
            <h2 className="text-2xl font-serif font-bold text-[#4e342e] mb-6">
              Project Details
            </h2>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-[#3e2723] font-semibold mb-2">
                  Primary Wood
                </label>
                <input
                  type="text"
                  name="primaryWood"
                  value={formData.primaryWood}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900 placeholder-gray-400"
                  placeholder="e.g., Teak, Mahogany"
                />
              </div>

              <div>
                <label className="block text-[#3e2723] font-semibold mb-2">
                  Client
                </label>
                <input
                  type="text"
                  name="client"
                  value={formData.client}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900 placeholder-gray-400"
                  placeholder="e.g., Private Client"
                />
              </div>
            </div>

            {/* SEO Tags */}
            <div className="mt-6">
              <label className="block text-[#3e2723] font-semibold mb-2">
                SEO Tags
                <span className="text-gray-500 font-normal text-sm ml-2">
                  (comma-separated keywords for search optimization)
                </span>
              </label>
              <input
                type="text"
                name="seoTags"
                value={formData.seoTags}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900 placeholder-gray-400"
                placeholder="e.g., handcrafted, wood flooring, custom design, luxury interiors"
              />
            </div>
          </div>

          {/* SPECIFICATIONS */}
          <div className="border-b border-[#d7ccc8] pb-6">
            <h2 className="text-2xl font-serif font-bold text-[#4e342e] mb-6">
              Specifications
            </h2>

            <div className="flex gap-4 mb-4">
              <input
                type="text"
                value={newSpecification.key}
                onChange={(e) =>
                  setNewSpecification((prev) => ({
                    ...prev,
                    key: e.target.value,
                  }))
                }
                placeholder="Specification name"
                className="flex-1 px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900"
              />
              <input
                type="text"
                value={newSpecification.value}
                onChange={(e) =>
                  setNewSpecification((prev) => ({
                    ...prev,
                    value: e.target.value,
                  }))
                }
                placeholder="Value"
                className="flex-1 px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900"
              />
              <button
                type="button"
                onClick={addSpecification}
                className="px-6 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition"
              >
                Add
              </button>
            </div>

            {formData.specifications.length > 0 && (
              <div className="space-y-2">
                {formData.specifications.map((spec, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-[#fcfaf6] p-3 rounded-lg"
                  >
                    <span className="text-gray-900">
                      <strong>{spec.key}:</strong> {spec.value}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSpecification(index)}
                      className="text-red-500 hover:text-red-700"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MATERIALS */}
          <div className="border-b border-[#d7ccc8] pb-6">
            <h2 className="text-2xl font-serif font-bold text-[#4e342e] mb-6">
              Materials Used
            </h2>

            <div className="flex gap-4 mb-4">
              <input
                type="text"
                value={newMaterial}
                onChange={(e) => setNewMaterial(e.target.value)}
                placeholder="Add a material"
                className="flex-1 px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900"
              />
              <button
                type="button"
                onClick={addMaterial}
                className="px-6 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition"
              >
                Add
              </button>
            </div>

            {formData.materials.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.materials.map((material, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 bg-[#d7ccc8]/50 px-3 py-1 rounded-full text-gray-900"
                  >
                    {material}
                    <button
                      type="button"
                      onClick={() => removeMaterial(index)}
                      className="text-red-500 hover:text-red-700"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* MAIN IMAGE */}
          <div className="border-b border-[#d7ccc8] pb-6">
            <h2 className="text-2xl font-serif font-bold text-[#4e342e] mb-6">
              Main Image *
            </h2>

            {/* Show uploading state with circular progress */}
            {isUploadingMain && !imagePreview && (
              <div className="border-2 border-dashed border-[#d7ccc8] rounded-lg p-6">
                <div className="flex flex-col items-center justify-center gap-4">
                  <CircularProgress
                    progress={uploadProgress.main || 0}
                    size={80}
                    showPercentage={true}
                  />
                  <span className="text-[#4e342e] font-medium">
                    Uploading main image...{" "}
                    {Math.round(uploadProgress.main || 0)}%
                  </span>
                </div>
              </div>
            )}

            {!isUploadingMain && !imagePreview && (
              <div className="border-2 border-dashed border-[#d7ccc8] rounded-lg p-6 text-center">
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMainImageUpload}
                    className="hidden"
                    disabled={isUploadingMain}
                  />
                  <div className="text-gray-500">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="mt-2 text-sm">
                      Click to upload main image (required)
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      PNG, JPG, WebP up to 100MB
                    </p>
                  </div>
                </label>
              </div>
            )}

            {imagePreview && (
              <div className="border-2 border-dashed border-[#d7ccc8] rounded-lg p-6 text-center">
                <div className="relative inline-block">
                  <img
                    src={
                      imagePreview.startsWith("data:")
                        ? imagePreview
                        : `${API_URL}/api/images/${imagePreview}`
                    }
                    alt="Main preview"
                    className="max-h-64 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveMainImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* GALLERY IMAGES */}
          <div className="border-b border-[#d7ccc8] pb-6">
            <h2 className="text-2xl font-serif font-bold text-[#4e342e] mb-6">
              Gallery Images
            </h2>

            {/* Show gallery uploading progress */}
            {isUploadingGallery && (
              <div className="mb-4 flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                <CircularProgress
                  progress={uploadProgress.gallery || 0}
                  size={60}
                  showPercentage={true}
                />
                <span className="text-[#4e342e] font-medium">
                  Uploading gallery images...{" "}
                  {Math.round(uploadProgress.gallery || 0)}%
                </span>
              </div>
            )}

            <div className="grid grid-cols-4 gap-4 mb-4">
              {galleryPreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={
                      preview.startsWith("data:")
                        ? preview
                        : `${API_URL}/api/images/${preview}`
                    }
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveGalleryImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}

              {/* Upload button */}
              <label className="cursor-pointer border-2 border-dashed border-[#d7ccc8] rounded-lg flex items-center justify-center h-24 hover:border-[#4e342e] transition">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryUpload}
                  className="hidden"
                  disabled={isUploadingGallery}
                />
                {isUploadingGallery ? (
                  <LoadingDots />
                ) : (
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                )}
              </label>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push("/admin?tab=projects")}
              className="px-6 py-3 border-2 border-[#4e342e] text-[#4e342e] rounded-lg hover:bg-[#4e342e] hover:text-white transition duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingMain || isUploadingGallery}
              className="px-6 py-3 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <LoadingDots />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Category Create Modal */}
      <CategoryCreateModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onCategoryCreated={handleCategoryCreated}
        type="project"
      />
    </div>
  );
}
