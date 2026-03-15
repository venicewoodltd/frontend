"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProducts } from "@/lib/graphql";
import {
  uploadImageToGridFS,
  deleteImageFromGridFS,
} from "@/lib/imageUploadService";
import { StandaloneToast } from "@/components/ui/Toast";
import CircularProgress from "@/components/ui/CircularProgress";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ProductPreviewModal from "@/components/ui/ProductPreviewModal";
import CategoryCreateModal from "@/components/ui/CategoryCreateModal";
import LoadingDots from "@/components/ui/LoadingDots";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function ProductEditForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");
  const { updateProduct, getProduct } = useProducts();

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

  const [imagePreview, setImagePreview] = useState("");
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [newSpecification, setNewSpecification] = useState({
    key: "",
    value: "",
  });

  // Upload progress tracking
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploadingMain, setIsUploadingMain] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

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
    type: null,
    index: null,
  });

  // Category create modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Toast helper functions
  const showToast = useCallback((type, title, message) => {
    setToast({ show: true, type, title, message });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  // Helper function to extract fileId from URL or return fileId as-is
  const extractFileId = useCallback((imageUrl) => {
    if (!imageUrl) return "";
    // If it's already a 24-char hex string (fileId), return as-is
    if (imageUrl.length === 24 && /^[0-9a-f]+$/i.test(imageUrl)) {
      return imageUrl;
    }
    // Extract fileId from URL like "/api/images/xxx" or "http://localhost:4000/api/images/xxx"
    const match = imageUrl.match(/\/api\/images\/([a-f0-9]{24})/i);
    return match ? match[1] : imageUrl;
  }, []);

  // Resolve image URL for preview display — handles relative paths, data URIs, and full URLs
  const resolvePreviewUrl = useCallback((url) => {
    if (!url) return "";
    if (
      url.startsWith("data:") ||
      url.startsWith("http") ||
      url.startsWith("blob:")
    )
      return url;
    return `${API_URL}${url}`;
  }, []);

  // Image removal handlers with confirmation
  const handleRemoveGalleryImage = useCallback(
    async (index) => {
      const rawFileId = formData.galleryImages[index];
      const fileIdToDelete = extractFileId(rawFileId);

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
      setFormData((prev) => ({
        ...prev,
        galleryImages: prev.galleryImages.filter((_, i) => i !== index),
      }));
      showToast(
        "success",
        "Image Removed",
        "Gallery image has been removed successfully.",
      );
      setConfirmModal({ show: false, type: null, index: null });
    },
    [showToast, formData.galleryImages, extractFileId],
  );

  const confirmRemoveGalleryImage = useCallback((index) => {
    setConfirmModal({ show: true, type: "gallery", index });
  }, []);

  const handleRemoveMainImage = useCallback(async () => {
    const rawFileId = formData.mainImage;
    const fileIdToDelete = extractFileId(rawFileId);

    // Delete from GridFS if fileId exists
    if (fileIdToDelete) {
      try {
        await deleteImageFromGridFS(fileIdToDelete);
        console.log("✅ Main image deleted from GridFS:", fileIdToDelete);
      } catch (err) {
        console.error("Failed to delete main image from GridFS:", err);
      }
    }

    setImagePreview("");
    setFormData((prev) => ({
      ...prev,
      mainImage: "",
    }));
    showToast(
      "success",
      "Image Removed",
      "Main image has been removed successfully.",
    );
    setConfirmModal({ show: false, type: null, index: null });
  }, [showToast, formData.mainImage, extractFileId]);

  const confirmRemoveMainImage = useCallback(() => {
    setConfirmModal({ show: true, type: "main", index: null });
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

  // Fetch product data on mount
  useEffect(() => {
    const fetchProduct = async () => {
      if (productId) {
        try {
          setError("");
          const product = await getProduct(productId);
          if (product) {
            setFormData({
              name: product.name || "",
              slug: product.slug || "",
              description: product.description || "",
              longDescription: product.longDescription || "",
              category: product.category || "Custom",
              mainImage: product.image || "",
              galleryImages: product.galleryImages || [],
              featured: product.featured || false,
              status: product.status || "draft",
              seoTags: product.seoTags || "",
              wood_type: product.wood_type || "",
              material: product.material || "",
              specifications: product.specifications || [],
              whatsappText: product.whatsappText || "",
              emailText: product.emailText || "",
            });
            setImagePreview(product.image || "");
            setGalleryPreviews(product.galleryImages || []);
          }
        } catch (err) {
          console.error("Error fetching product:", err);
          setError("Failed to load product. " + err.message);
        }
      }
      setIsLoading(false);
    };

    fetchProduct();
  }, [productId, getProduct]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle main image upload
  const handleMainImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploadingMain(true);
        setUploadProgress((prev) => ({ ...prev, main: 0 }));

        // Show preview while uploading
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Upload to GridFS with progress
        const result = await uploadImageToGridFS(file, (progress) => {
          setUploadProgress((prev) => ({ ...prev, main: progress }));
        });

        if (result && result.success && result.fileId) {
          console.log(`✅ Main image uploaded. FileID: ${result.fileId}`);
          setFormData((prev) => ({
            ...prev,
            mainImage: result.fileId,
          }));
          showToast(
            "success",
            "Upload Complete",
            "Main image uploaded successfully!",
          );
        } else {
          throw new Error("Upload did not return a valid fileId");
        }
      } catch (err) {
        console.error("Main image upload error:", err);
        setImagePreview("");
        showToast(
          "error",
          "Upload Failed",
          "Failed to upload main image. Please try again.",
        );
      } finally {
        setIsUploadingMain(false);
        setUploadProgress((prev) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { main: _main, ...rest } = prev;
          return rest;
        });
      }
    }
  };

  // Handle gallery image uploads
  const handleGalleryUpload = async (e) => {
    const files = e.target.files;
    if (files) {
      setIsUploadingGallery(true);
      const newPreviews = [...galleryPreviews];
      const newGalleryImages = [];
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progressKey = `gallery-${i + 1}`;

        try {
          console.log(`📤 Uploading gallery image: ${file.name}`);
          setUploadProgress((prev) => ({ ...prev, [progressKey]: 0 }));

          // Upload to GridFS with progress
          const result = await uploadImageToGridFS(file, (progress) => {
            setUploadProgress((prev) => ({ ...prev, [progressKey]: progress }));
          });

          if (result.success && result.fileId) {
            // Show preview
            const reader = new FileReader();
            reader.onloadend = () => {
              newPreviews.push(reader.result);
            };
            reader.readAsDataURL(file);

            newGalleryImages.push(result.fileId);
            successCount++;
            console.log(`✅ Gallery image uploaded. FileID: ${result.fileId}`);
          }
        } catch (uploadErr) {
          console.error(
            `Gallery image upload error for ${file.name}:`,
            uploadErr,
          );
          failCount++;
        }

        // Clear progress for this file after upload
        setUploadProgress((prev) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [progressKey]: _unused, ...rest } = prev;
          return rest;
        });
      }

      if (newGalleryImages.length > 0) {
        setGalleryPreviews(newPreviews);
        setFormData((prev) => ({
          ...prev,
          galleryImages: [...(prev.galleryImages || []), ...newGalleryImages],
        }));
      }

      // Show appropriate toast
      if (successCount > 0 && failCount === 0) {
        showToast(
          "success",
          "Upload Complete",
          `${successCount} gallery image${
            successCount > 1 ? "s" : ""
          } uploaded successfully!`,
        );
      } else if (successCount > 0 && failCount > 0) {
        showToast(
          "warning",
          "Partial Upload",
          `${successCount} uploaded, ${failCount} failed. Please try again for failed uploads.`,
        );
      } else if (failCount > 0) {
        showToast(
          "error",
          "Upload Failed",
          "Failed to upload gallery images. Please try again.",
        );
      }

      setIsUploadingGallery(false);
    }
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
    setIsSubmitting(true);

    try {
      // Helper function to extract fileId from URL or return fileId as-is
      const extractFileId = (imageUrl) => {
        if (!imageUrl) return "";
        // If it's already a 24-char hex string (fileId), return as-is
        if (imageUrl.length === 24 && /^[0-9a-f]+$/i.test(imageUrl)) {
          return imageUrl;
        }
        // Extract fileId from URL like "/api/images/xxx" or "http://localhost:4000/api/images/xxx"
        const match = imageUrl.match(/\/api\/images\/([a-f0-9]{24})/i);
        return match ? match[1] : imageUrl;
      };

      const input = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        longDescription: formData.longDescription,
        category: formData.category,
        mainImage: extractFileId(formData.mainImage),
        galleryImages: formData.galleryImages
          .map(extractFileId)
          .filter((id) => id),
        featured: formData.featured,
        status: formData.status || "draft",
        seoTags: formData.seoTags,
        wood_type: formData.wood_type,
        material: formData.material,
        specifications: formData.specifications,
      };

      console.log("📤 [ProductEditForm] Submitting with images:", {
        mainImage: input.mainImage,
        galleryImages: input.galleryImages,
      });

      const result = await updateProduct(productId, input);

      if (result && result.updateProduct) {
        setSuccess(true);
        setSuccessMessage("Product updated successfully!");
        showToast(
          "success",
          "Product Updated",
          "Your product has been updated successfully!",
        );
        setTimeout(() => {
          router.push("/admin?tab=products");
        }, 2000);
      } else {
        setError("Failed to update product");
        showToast(
          "error",
          "Update Failed",
          "Failed to update product. Please try again.",
        );
      }
    } catch (err) {
      console.error("Error updating product:", err);
      setError("Error updating product: " + err.message);
      showToast(
        "error",
        "Update Error",
        err.message || "An error occurred while updating the product.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fcfaf6] py-12 px-4 flex items-center justify-center">
        <div className="text-[#4e342e] text-lg">Loading product...</div>
      </div>
    );
  }

  if (!productId) {
    return (
      <div className="min-h-screen bg-[#fcfaf6] py-12 px-4">
        <div className="max-w-2xl mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: No product ID provided
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfaf6] py-12 px-4">
      {/* Toast Notification */}
      <StandaloneToast
        type={toast.type}
        title={toast.title}
        message={toast.message}
        isVisible={toast.show}
        onClose={hideToast}
      />

      {/* Confirm Modal for Image Deletion */}
      <ConfirmModal
        isOpen={confirmModal.show}
        onClose={() =>
          setConfirmModal({ show: false, type: null, index: null })
        }
        onConfirm={() => {
          if (confirmModal.type === "main") {
            handleRemoveMainImage();
          } else if (
            confirmModal.type === "gallery" &&
            confirmModal.index !== null
          ) {
            handleRemoveGalleryImage(confirmModal.index);
          }
        }}
        title="Remove Image"
        message={
          confirmModal.type === "main"
            ? "Are you sure you want to remove the main product image?"
            : "Are you sure you want to remove this gallery image?"
        }
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
              Edit Product
            </h1>
            <p className="text-gray-600">
              Update product details and manage images stored in MongoDB
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
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
              <label className="block text-black font-semibold mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900"
                placeholder="e.g., Wooden Doors"
              />
            </div>

            <div className="mb-6">
              <label className="block text-black font-semibold mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="5"
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900"
                placeholder="Premium handcrafted wooden doors for your home and business..."
              />
            </div>

            <div className="mb-6">
              <label className="block text-black font-semibold mb-2">
                Slug (URL-friendly name) *
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900"
                placeholder="e.g., wooden-doors (use lowercase and hyphens)"
              />
            </div>

            <div className="mb-6">
              <label className="block text-black font-semibold mb-2">
                Long Description
              </label>
              <textarea
                name="longDescription"
                value={formData.longDescription}
                onChange={handleChange}
                rows="5"
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900"
                placeholder="Detailed product description, features, and benefits..."
              />
            </div>

            <div className="mb-6">
              <label className="block text-black font-semibold mb-2">
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
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900"
                placeholder="e.g., handcrafted, solid wood, luxury furniture, custom design"
              />
            </div>

            <div className="grid grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-black font-semibold mb-2">
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
                <label className="block text-black font-semibold mb-2">
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
                  <span className="text-black font-semibold">
                    Featured Product
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* MATERIALS & SPECIFICATIONS */}
          <div className="border-b border-[#d7ccc8] pb-6">
            <h2 className="text-2xl font-serif font-bold text-[#4e342e] mb-6">
              Materials & Specifications
            </h2>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-black font-semibold mb-2">
                  Wood Type
                </label>
                <input
                  type="text"
                  name="wood_type"
                  value={formData.wood_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900"
                  placeholder="e.g., Brazilian Rosewood"
                />
              </div>

              <div>
                <label className="block text-black font-semibold mb-2">
                  Material
                </label>
                <input
                  type="text"
                  name="material"
                  value={formData.material}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900"
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
                  placeholder="e.g., Premium Wood"
                  className="flex-1 px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900"
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

          {/* IMAGE MANAGEMENT */}
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
                    src={resolvePreviewUrl(imagePreview)}
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
                Upload Main Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleMainImageUpload}
                disabled={isUploadingMain}
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-[#fcfaf6] text-[#3e2723] disabled:opacity-50"
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
                        src={resolvePreviewUrl(preview)}
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
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-[#fcfaf6] text-[#3e2723] disabled:opacity-50"
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
              disabled={isSubmitting || isUploadingMain || isUploadingGallery}
              className="flex-1 py-3 bg-[#4e342e] text-white font-semibold rounded-lg hover:bg-[#3e2723] transition duration-300 disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  Updating
                  <LoadingDots />
                </span>
              ) : isUploadingMain || isUploadingGallery ? (
                <span className="flex items-center">
                  Uploading
                  <LoadingDots />
                </span>
              ) : (
                "Update Product"
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
