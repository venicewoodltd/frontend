"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProducts } from "@/lib/graphql";
import {
  uploadImageToGridFS,
  validateImageFile,
  deleteImageFromGridFS,
} from "@/lib/imageUploadService";
import { StandaloneToast } from "@/components/ui/Toast";
import CircularProgress from "@/components/ui/CircularProgress";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ProductPreviewModal from "@/components/ui/ProductPreviewModal";
import CategoryCreateModal from "@/components/ui/CategoryCreateModal";
import LoadingDots from "@/components/ui/LoadingDots";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function ProductCreateForm() {
  const router = useRouter();
  const { createProduct, loading, error: graphqlError } = useProducts();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    longDescription: "",
    category: "Custom",
    mainImage: "",
    galleryImages: [],
    featured: false,
    status: "draft",
    seoTags: "",
    wood_type: "",
    material: "",
    specifications: [],
    whatsappText: "",
    emailText: "",
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
  const [newSpecification, setNewSpecification] = useState({
    key: "",
    value: "",
  });

  // Toast notification state
  const [toast, setToast] = useState({
    show: false,
    type: "success",
    title: "",
    message: "",
  });

  // Preview modal state
  const [showPreview, setShowPreview] = useState(false);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    type: "gallery",
    index: null,
  });

  // Category create modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const showToast = useCallback((type, title, message = "") => {
    setToast({ show: true, type, title, message });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  // Fetch categories function
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/categories?type=product`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
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
            // Show preview
            const reader = new FileReader();
            reader.onloadend = () => {
              newPreviews.push(reader.result);
            };
            reader.readAsDataURL(file);

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

  // Legacy function for backwards compatibility
  const removeGalleryImage = (index) => {
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
    setGalleryFileIds((prev) => {
      const newIds = prev.filter((_, i) => i !== index);
      setFormData((prevForm) => ({
        ...prevForm,
        galleryImages: newIds,
      }));
      return newIds;
    });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setError("");

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error("Product name is required");
      }
      if (!formData.slug.trim()) {
        throw new Error("Slug is required");
      }
      if (!formData.mainImage) {
        throw new Error("Main image is required");
      }

      const input = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description || "",
        longDescription: formData.longDescription || "",
        category: formData.category || "Custom",
        mainImage: formData.mainImage,
        galleryImages:
          formData.galleryImages && formData.galleryImages.length > 0
            ? formData.galleryImages
            : [],
        featured: !!formData.featured,
        status: formData.status || "draft",
        wood_type: formData.wood_type || null,
        material: formData.material || null,
        specifications: Array.isArray(formData.specifications)
          ? formData.specifications
          : [],
      };

      // Log what we're sending
      console.log("📤 SENDING TO GRAPHQL:", JSON.stringify(input, null, 2));

      const result = await createProduct(input);

      if (result && result.createProduct) {
        setSuccess(true);
        setSuccessMessage("Product created successfully!");
        showToast(
          "success",
          "Product Created",
          "Your product has been created successfully!",
        );
        setTimeout(() => {
          router.push("/admin?tab=products");
        }, 2000);
      }
    } catch (err) {
      console.error("FRONTEND ERROR:", err.message);
      setError(err.message || "Failed to create product");
      showToast(
        "error",
        "Creation Failed",
        err.message || "Failed to create product",
      );
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

      {/* Category Create Modal */}
      <CategoryCreateModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onCategoryCreated={handleCategoryCreated}
        type="product"
      />

      {/* Product Preview Modal */}
      <ProductPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        product={{
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          longDescription: formData.longDescription,
          category: formData.category,
          mainImage: imagePreview || formData.mainImage,
          galleryImages:
            galleryPreviews.length > 0
              ? galleryPreviews
              : formData.galleryImages,
          featured: formData.featured,
          status: formData.status,
          wood_type: formData.wood_type,
          material: formData.material,
          specifications: formData.specifications,
        }}
      />

      <div className="max-w-4xl mx-auto">
        {/* Header with Preview Button */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-serif font-bold text-[#4e342e] mb-2">
              Create New Product
            </h1>
            <p className="text-gray-600">
              Add a new product with images stored in MongoDB and data in
              PostgreSQL
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

        {graphqlError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            ✗ GraphQL Error: {graphqlError}
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
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900 placeholder-gray-400"
                placeholder="e.g., Wooden Doors"
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
                placeholder="e.g., Premium handcrafted wooden doors"
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
                placeholder="Detailed product description, features, and benefits..."
              />
            </div>

            <div className="mb-6">
              <label className="block text-[#3e2723] font-semibold mb-2">
                Slug (URL-friendly name) *
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900 placeholder-gray-400"
                placeholder="e.g., wooden-doors (use lowercase and hyphens)"
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
                      <option value="Custom">Custom</option>
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

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                    className="mr-3 w-4 h-4"
                  />
                  <span className="text-[#3e2723] font-semibold">
                    Featured Product
                  </span>
                </label>
              </div>
            </div>

            <div className="mb-6">
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
                placeholder="e.g., handcrafted, solid wood, luxury furniture, custom design"
              />
            </div>
          </div>

          {/* MATERIALS & SPECIFICATIONS */}
          <div className="border-b border-[#d7ccc8] pb-6">
            <h2 className="text-2xl font-serif font-bold text-[#4e342e] mb-6">
              Materials & Specifications
            </h2>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-[#3e2723] font-semibold mb-2">
                  Wood Type
                </label>
                <input
                  type="text"
                  name="wood_type"
                  value={formData.wood_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900 placeholder-gray-400"
                  placeholder="e.g., Brazilian Rosewood"
                />
              </div>

              <div>
                <label className="block text-[#3e2723] font-semibold mb-2">
                  Material
                </label>
                <input
                  type="text"
                  name="material"
                  value={formData.material}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900 placeholder-gray-400"
                  placeholder="e.g., Premium Wood"
                />
              </div>
            </div>

            {/* Dynamic Specifications */}
            <div className="mt-6 pt-6 border-t border-[#d7ccc8]">
              <h3 className="text-lg font-semibold text-[#4e342e] mb-4">
                Product Specifications
              </h3>

              <div className="space-y-3 mb-4">
                {formData.specifications.map((spec, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-[#d7ccc8]"
                  >
                    <div>
                      <p className="font-semibold text-[#3e2723]">{spec.key}</p>
                      <p className="text-gray-600">{spec.value}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSpecification(index)}
                      className="text-red-500 hover:text-red-700 font-semibold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={newSpecification.key}
                  onChange={(e) =>
                    setNewSpecification((prev) => ({
                      ...prev,
                      key: e.target.value,
                    }))
                  }
                  placeholder="e.g., Material"
                  className="flex-1 px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900 placeholder-gray-400"
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
                  placeholder="e.g., Premium Wood"
                  className="flex-1 px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={addSpecification}
                  className="px-4 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* INQUIRY MESSAGE TEMPLATES */}
          <div className="border-b border-[#d7ccc8] pb-6">
            <h2 className="text-2xl font-serif font-bold text-[#4e342e] mb-6">
              Inquiry Message Templates
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              Customize the pre-filled messages sent when customers click
              WhatsApp or Email inquiry buttons on the product page. Leave blank
              to use the default template.
            </p>

            <div className="mb-6">
              <label className="block text-[#3e2723] font-semibold mb-2">
                WhatsApp Message Template
                <span className="text-gray-500 font-normal text-sm ml-2">
                  (pre-filled text when customer opens WhatsApp)
                </span>
              </label>
              <textarea
                name="whatsappText"
                value={formData.whatsappText}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900 placeholder-gray-400"
                placeholder={`e.g., Hi! I'm interested in ${formData.name || "this product"}. Could you provide more details about pricing and availability?`}
              />
              <p className="text-xs text-gray-400 mt-1">
                Default: "Hi! I'm interested in {"{product name}"}. Could you
                provide more details about pricing and availability?"
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-[#3e2723] font-semibold mb-2">
                Email Message Template
                <span className="text-gray-500 font-normal text-sm ml-2">
                  (pre-filled email body for customer inquiries)
                </span>
              </label>
              <textarea
                name="emailText"
                value={formData.emailText}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900 placeholder-gray-400"
                placeholder={`e.g., I would like to inquire about ${formData.name || "this product"}. Please provide pricing and customization options.`}
              />
              <p className="text-xs text-gray-400 mt-1">
                Default: "I would like to inquire about {"{product name}"}.
                Please provide pricing and customization options."
              </p>
            </div>
          </div>

          {/* IMAGE MANAGEMENT - MONGODB GRIDFS */}
          <div className="border-b border-[#d7ccc8] pb-6">
            <h2 className="text-2xl font-serif font-bold text-[#4e342e] mb-6">
              Image Management (MongoDB GridFS Storage)
            </h2>

            {/* Main Product Image */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#4e342e] mb-4">
                Main Product Image
              </h3>

              {/* Show uploading state with circular progress */}
              {isUploadingMain && uploadProgress.main !== undefined && (
                <div className="mb-4 flex items-center gap-4">
                  <CircularProgress
                    progress={uploadProgress.main}
                    size={80}
                    showPercentage={true}
                  />
                  <span className="text-[#4e342e]">
                    Uploading main image...
                  </span>
                </div>
              )}

              {/* Show image preview with delete button */}
              {imagePreview && !isUploadingMain && (
                <div className="mb-4 relative inline-block group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Main preview"
                    className="max-w-xs h-64 object-cover rounded-lg border-2 border-[#d7ccc8]"
                  />
                  {/* Delete button overlay */}
                  <button
                    type="button"
                    onClick={confirmRemoveMainImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-red-600"
                    title="Remove image"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  {formData.mainImage && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ Image uploaded (ID: {formData.mainImage.substring(0, 8)}
                      ...)
                    </p>
                  )}
                </div>
              )}

              <label className="block text-[#3e2723] font-semibold mb-2">
                Upload Main Image *
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleMainImageUpload}
                disabled={isUploadingMain}
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-[#fcfaf6] text-[#3e2723] placeholder-gray-400 disabled:opacity-50"
              />
              <p className="text-sm text-gray-500 mt-2">
                Supported: JPG, PNG, WebP, GIF, SVG, BMP, TIFF, ICO (Max 100MB)
              </p>
            </div>

            {/* Gallery Images */}
            <div>
              <h3 className="text-lg font-semibold text-[#4e342e] mb-4">
                Gallery Images
              </h3>

              {/* Gallery uploading progress */}
              {isUploadingGallery &&
                Object.keys(uploadProgress).some((k) =>
                  k.startsWith("gallery"),
                ) && (
                  <div className="mb-4 flex flex-wrap items-center gap-4">
                    {Object.entries(uploadProgress).map(([key, progress]) =>
                      key.startsWith("gallery") ? (
                        <div key={key} className="flex items-center gap-2">
                          <CircularProgress
                            progress={progress}
                            size={60}
                            showPercentage={true}
                          />
                          <span className="text-sm text-[#4e342e]">
                            Image {key.replace("gallery-", "")}
                          </span>
                        </div>
                      ) : null,
                    )}
                  </div>
                )}

              {galleryPreviews.length > 0 && (
                <div className="mb-6 grid grid-cols-4 gap-4">
                  {galleryPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preview}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-[#d7ccc8]"
                      />
                      <button
                        type="button"
                        onClick={() => confirmRemoveGalleryImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-red-600"
                        title="Remove image"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="block text-[#3e2723] font-semibold mb-2">
                Upload Gallery Images (Multiple)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleGalleryUpload}
                disabled={isUploadingGallery}
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-[#fcfaf6] text-[#3e2723] placeholder-gray-400 disabled:opacity-50"
              />
              <p className="text-sm text-gray-500 mt-2">
                Upload multiple images for the product gallery (Max 100MB each)
              </p>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || isUploadingMain || isUploadingGallery}
              className="flex-1 py-3 bg-[#4e342e] text-white font-semibold rounded-lg hover:bg-[#3e2723] transition duration-300 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <span className="flex items-center">
                  Creating
                  <LoadingDots />
                </span>
              ) : isUploadingMain || isUploadingGallery ? (
                <span className="flex items-center">
                  Uploading
                  <LoadingDots />
                </span>
              ) : (
                "Create Product"
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin?tab=products")}
              className="flex-1 py-3 bg-gray-400 text-white font-semibold rounded-lg hover:bg-gray-500 transition duration-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
