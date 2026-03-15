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
import BlogPreviewModal from "@/components/ui/BlogPreviewModal";
import CategoryCreateModal from "@/components/ui/CategoryCreateModal";
import LoadingDots from "@/components/ui/LoadingDots";
import WYSIWYGEditor from "@/components/ui/WYSIWYGEditor";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function BlogCreateForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "",
    featuredImage: "",
    featured: false,
    status: "draft",
    author: "Venice Wood Ltd",
    seoTags: "",
  });

  const [categories, setCategories] = useState([]);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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
    type: "image",
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
      const response = await fetch(`${API_URL}/api/categories?type=blog`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
        // Set first category as default if available and no category is set
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

  // Generate slug from title
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  // Handle title change and auto-generate slug
  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }));
  };

  // Handle featured image upload to GridFS
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    const validation = validateImageFile(file);

    if (!validation.valid) {
      setError(validation.errors.join(", "));
      return;
    }

    try {
      setIsUploadingImage(true);
      console.log(
        `📤 Uploading featured image: ${file.name} (${validation.fileSize})`,
      );

      // Show preview while uploading
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      const result = await uploadImageToGridFS(file, (progress) => {
        setUploadProgress(progress);
      });

      console.log("🔍 Upload result:", result);

      if (result && result.success && result.fileId) {
        console.log(`✅ Featured image uploaded. FileID: ${result.fileId}`);
        setFormData((prev) => ({
          ...prev,
          featuredImage: result.fileId,
        }));
        setError("");
        showToast(
          "success",
          "Image Uploaded",
          "Featured image uploaded successfully",
        );
      } else {
        throw new Error("Upload did not return a valid fileId");
      }
    } catch (err) {
      console.error("Featured image upload error:", err);
      setError(`Image upload failed: ${err.message}`);
      showToast("error", "Upload Failed", err.message);
      setImagePreview("");
    } finally {
      setIsUploadingImage(false);
      setUploadProgress(0);
    }
  };

  // Remove featured image with confirmation
  const handleRemoveImage = () => {
    setConfirmModal({ show: true, type: "image" });
  };

  // Confirm featured image removal
  const confirmRemoveImage = async () => {
    const fileIdToDelete = formData.featuredImage;

    // Delete from GridFS if fileId exists
    if (fileIdToDelete) {
      try {
        await deleteImageFromGridFS(fileIdToDelete);
        console.log("✅ Featured image deleted from GridFS:", fileIdToDelete);
      } catch (err) {
        console.error("Failed to delete featured image from GridFS:", err);
      }
    }

    setFormData((prev) => ({ ...prev, featuredImage: "" }));
    setImagePreview("");
    setConfirmModal({ show: false, type: "image" });
    showToast(
      "success",
      "Image Removed",
      "Featured image removed successfully",
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setError("");
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error("Blog title is required");
      }
      if (!formData.content || formData.content.length < 100) {
        throw new Error("Blog content must be at least 100 characters");
      }

      const token = localStorage.getItem("adminToken");

      // Create FormData for multipart submission
      const submitData = new FormData();
      submitData.append("title", formData.title.trim());
      submitData.append("slug", formData.slug || generateSlug(formData.title));
      submitData.append("excerpt", formData.excerpt || "");
      submitData.append("content", formData.content);
      submitData.append("category", formData.category || "General");
      submitData.append("status", formData.status || "draft");
      submitData.append("featured", formData.featured ? "true" : "false");
      submitData.append("author", formData.author || "Venice Wood Ltd");
      submitData.append("seoTags", formData.seoTags || "");

      // If we have a pre-uploaded image fileId, include it
      if (formData.featuredImage) {
        submitData.append("featuredImageFileId", formData.featuredImage);
      }

      const response = await fetch(`${API_URL}/api/admin/blogs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitData,
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setSuccessMessage("Blog post created successfully!");
        showToast(
          "success",
          "Blog Created",
          "Your blog post has been created successfully!",
        );
        setTimeout(() => {
          router.push("/admin?tab=blogs");
        }, 2000);
      } else {
        throw new Error(result.message || "Failed to create blog post");
      }
    } catch (err) {
      console.error("FRONTEND ERROR:", err.message);
      setError(err.message || "Failed to create blog post");
      showToast(
        "error",
        "Creation Failed",
        err.message || "Failed to create blog post",
      );
    } finally {
      setLoading(false);
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
        onClose={() => setConfirmModal({ show: false, type: "image" })}
        onConfirm={confirmRemoveImage}
        title="Remove Featured Image"
        message="Are you sure you want to remove this image? This action cannot be undone."
        confirmText="Remove"
        type="danger"
      />

      {/* Category Create Modal */}
      <CategoryCreateModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onCategoryCreated={handleCategoryCreated}
        type="blog"
      />

      {/* Blog Preview Modal */}
      <BlogPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        blog={{
          title: formData.title,
          slug: formData.slug,
          excerpt: formData.excerpt,
          content: formData.content,
          category: formData.category,
          featuredImage: imagePreview || formData.featuredImage,
          featured: formData.featured,
          status: formData.status,
          author: formData.author,
          seoTags: formData.seoTags,
        }}
      />

      <div className="max-w-4xl mx-auto">
        {/* Header with Preview Button */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-serif font-bold text-[#4e342e] mb-2">
              Create New Blog Post
            </h1>
            <p className="text-gray-600">
              Write and publish blog articles with rich content and images
            </p>
          </div>
          <div className="flex gap-2">
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
            <button
              type="button"
              onClick={() => router.push("/admin?tab=blogs")}
              className="flex items-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition duration-300"
            >
              Cancel
            </button>
          </div>
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
          {/* FEATURED IMAGE */}
          <div className="border-b border-[#d7ccc8] pb-6">
            <h2 className="text-2xl font-serif font-bold text-[#4e342e] mb-6">
              Featured Image
            </h2>

            <div className="space-y-4">
              {imagePreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Featured preview"
                    className="w-full max-h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
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
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <CircularProgress percentage={uploadProgress} size={60} />
                    </div>
                  )}
                </div>
              ) : (
                <label className="block border-2 border-dashed border-[#d7ccc8] rounded-lg p-8 text-center cursor-pointer hover:border-[#4e342e] transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploadingImage}
                  />
                  {isUploadingImage ? (
                    <div className="flex flex-col items-center">
                      <CircularProgress percentage={uploadProgress} size={60} />
                      <p className="mt-2 text-gray-500">Uploading...</p>
                    </div>
                  ) : (
                    <>
                      <svg
                        className="w-12 h-12 mx-auto text-gray-400 mb-4"
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
                      <p className="text-[#4e342e] font-semibold">
                        Click to upload featured image
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        JPG, PNG, WebP up to 100MB
                      </p>
                    </>
                  )}
                </label>
              )}
            </div>
          </div>

          {/* BASIC INFORMATION */}
          <div className="border-b border-[#d7ccc8] pb-6">
            <h2 className="text-2xl font-serif font-bold text-[#4e342e] mb-6">
              Basic Information
            </h2>

            <div className="mb-6">
              <label className="block text-[#3e2723] font-semibold mb-2">
                Blog Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleTitleChange}
                required
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900 placeholder-gray-400"
                placeholder="e.g., The Art of Handcrafted Woodworking"
              />
            </div>

            <div className="mb-6">
              <label className="block text-[#3e2723] font-semibold mb-2">
                Slug (URL-friendly name)
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900 placeholder-gray-400"
                placeholder="Auto-generated from title"
              />
            </div>

            <div className="mb-6">
              <label className="block text-[#3e2723] font-semibold mb-2">
                Excerpt (Preview Text)
              </label>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:outline-none focus:border-[#4e342e] transition bg-white text-gray-900 placeholder-gray-400"
                placeholder="Short summary that appears in blog listings..."
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
                      <option value="" disabled>
                        No categories - create one first
                      </option>
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

              <div className="flex items-center pt-8">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                    className="mr-3 w-4 h-4"
                  />
                  <span className="text-[#3e2723] font-semibold">
                    Featured Post
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* CONTENT EDITOR */}
          <div className="border-b border-[#d7ccc8] pb-6">
            <h2 className="text-2xl font-serif font-bold text-[#3e2723] mb-6">
              Content *
            </h2>

            <WYSIWYGEditor
              value={formData.content}
              onChange={(html) =>
                setFormData((prev) => ({ ...prev, content: html }))
              }
              placeholder="Start writing your blog content..."
              minHeight="384px"
            />
            <p className="text-xs text-gray-500 mt-2">
              Min 100 characters required. Use the toolbar above to format your
              content.
            </p>
          </div>

          {/* SEO */}
          <div className="border-b border-[#d7ccc8] pb-6">
            <h2 className="text-2xl font-serif font-bold text-[#4e342e] mb-6">
              SEO Optimization
            </h2>

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
                placeholder="e.g., woodworking, craftsmanship, handmade, artisan, luxury"
              />
              {formData.seoTags && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.seoTags.split(",").map((tag, index) => (
                    <span
                      key={index}
                      className="bg-[#4e342e]/10 text-[#4e342e] px-2 py-1 rounded text-sm"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SUBMIT */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-3 text-white font-semibold rounded-lg transition ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#4e342e] hover:bg-[#3e2723]"
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <LoadingDots /> Creating...
                </span>
              ) : (
                "Create Blog Post"
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin?tab=blogs")}
              className="px-8 py-3 bg-gray-400 text-white font-semibold rounded-lg hover:bg-gray-500 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
