"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";

interface ImageAssociation {
  entityType: "product" | "project" | "blog" | "hero";
  entityId: string;
  entityName: string;
  entitySlug: string;
  imageType: string;
}

interface GalleryImage {
  fileId: string;
  filename: string;
  contentType: string;
  size: number;
  uploadDate: string;
  url: string;
  bucket?: string;
  associations: ImageAssociation[];
  isOrphaned: boolean;
}

interface GalleryStats {
  totalImages: number;
  orphanedImages: number;
  productImages: number;
  projectImages: number;
  blogImages: number;
  heroImages?: number;
  totalSize: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// Format bytes to human readable
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Format date
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

export default function GalleryManagementTab() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [stats, setStats] = useState<GalleryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [filter, setFilter] = useState<
    "all" | "orphaned" | "product" | "project" | "blog" | "hero"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API_URL}/api/admin/gallery`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setImages(data.data || []);
        setStats(data.stats || null);
      } else {
        setError(data.error || "Failed to fetch images");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch images");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleShareImage = async (image: GalleryImage) => {
    const imageUrl = `${API_URL}${image.url}`;
    try {
      await navigator.clipboard.writeText(imageUrl);
      setCopiedId(image.fileId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = imageUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedId(image.fileId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDeleteImage = async (image: GalleryImage) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${image.filename}"?\n\nThis will remove the image from GridFS and any Media references.`,
      )
    ) {
      return;
    }

    try {
      setDeletingId(image.fileId);
      const token = localStorage.getItem("adminToken");

      // Include bucket parameter for proper deletion
      const bucketParam = image.bucket ? `?bucket=${image.bucket}` : "";
      const response = await fetch(
        `${API_URL}/api/admin/gallery/${image.fileId}${bucketParam}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (data.success) {
        setImages((prev) => prev.filter((img) => img.fileId !== image.fileId));
        if (selectedImage?.fileId === image.fileId) {
          setSelectedImage(null);
        }
        // Update stats
        if (stats) {
          setStats((prev) =>
            prev ? { ...prev, totalImages: prev.totalImages - 1 } : null,
          );
        }
        showToast({
          type: "success",
          title: "Image Deleted",
          message: `"${image.filename}" has been deleted.`,
        });
      } else {
        showToast({
          type: "error",
          title: "Delete Failed",
          message: data.error || "Failed to delete image",
        });
      }
    } catch (err) {
      showToast({
        type: "error",
        title: "Delete Error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCleanupOrphaned = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete all ${
          stats?.orphanedImages || 0
        } orphaned images?\n\nThis cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      setCleaningUp(true);
      const token = localStorage.getItem("adminToken");

      const response = await fetch(
        `${API_URL}/api/admin/gallery/cleanup/orphaned`,
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
          title: "Cleanup Complete",
          message: `Deleted ${data.deletedCount} orphaned images`,
        });
        fetchImages(); // Refresh the list
      } else {
        showToast({
          type: "error",
          title: "Cleanup Failed",
          message: data.error || "Failed to cleanup",
        });
      }
    } catch (err) {
      showToast({
        type: "error",
        title: "Cleanup Error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setCleaningUp(false);
    }
  };

  // Filter images
  const filteredImages = images.filter((img) => {
    // Apply type filter
    if (filter === "orphaned" && !img.isOrphaned) return false;
    if (
      filter === "product" &&
      !img.associations.some((a) => a.entityType === "product")
    )
      return false;
    if (
      filter === "project" &&
      !img.associations.some((a) => a.entityType === "project")
    )
      return false;
    if (
      filter === "blog" &&
      !img.associations.some((a) => a.entityType === "blog")
    )
      return false;
    if (
      filter === "hero" &&
      !img.associations.some((a) => a.entityType === "hero")
    )
      return false;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesFilename = img.filename.toLowerCase().includes(term);
      const matchesAssociation = img.associations.some((a) =>
        a.entityName.toLowerCase().includes(term),
      );
      return matchesFilename || matchesAssociation;
    }

    return true;
  });

  const getEntityTypeColor = (type: string): string => {
    switch (type) {
      case "product":
        return "bg-blue-100 text-blue-700";
      case "project":
        return "bg-green-100 text-green-700";
      case "blog":
        return "bg-purple-100 text-purple-700";
      case "hero":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getImageTypeColor = (type: string): string => {
    switch (type) {
      case "main":
        return "bg-amber-100 text-amber-700";
      case "gallery":
        return "bg-indigo-100 text-indigo-700";
      case "featured":
        return "bg-rose-100 text-rose-700";
      case "carousel":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-[#4e342e]">Loading gallery...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h3 className="text-xl font-semibold text-[#3e2723]">
          Gallery Management
        </h3>
        <div className="flex gap-2">
          <button
            onClick={fetchImages}
            className="px-4 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition-colors"
          >
            Refresh
          </button>
          {stats && stats.orphanedImages > 0 && (
            <button
              onClick={handleCleanupOrphaned}
              disabled={cleaningUp}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {cleaningUp
                ? "Cleaning..."
                : `Clean ${stats.orphanedImages} Orphaned`}
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border border-[#d7ccc8]">
            <p className="text-2xl font-bold text-[#4e342e]">
              {stats.totalImages}
            </p>
            <p className="text-sm text-gray-600">Total Images</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-[#d7ccc8]">
            <p className="text-2xl font-bold text-blue-600">
              {stats.productImages}
            </p>
            <p className="text-sm text-gray-600">Product Images</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-[#d7ccc8]">
            <p className="text-2xl font-bold text-green-600">
              {stats.projectImages}
            </p>
            <p className="text-sm text-gray-600">Project Images</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-[#d7ccc8]">
            <p className="text-2xl font-bold text-purple-600">
              {stats.blogImages}
            </p>
            <p className="text-sm text-gray-600">Blog Images</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-[#d7ccc8]">
            <p className="text-2xl font-bold text-orange-600">
              {stats.heroImages || 0}
            </p>
            <p className="text-sm text-gray-600">Hero Images</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-[#d7ccc8]">
            <p className="text-2xl font-bold text-red-600">
              {stats.orphanedImages}
            </p>
            <p className="text-sm text-gray-600">Orphaned</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-[#d7ccc8]">
            <p className="text-2xl font-bold text-[#4e342e]">
              {formatBytes(stats.totalSize)}
            </p>
            <p className="text-sm text-gray-600">Total Size</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {(
            ["all", "product", "project", "blog", "hero", "orphaned"] as const
          ).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-[#4e342e] text-white"
                  : "bg-white text-[#4e342e] border border-[#d7ccc8] hover:bg-[#4e342e]/10"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "orphaned" && stats && ` (${stats.orphanedImages})`}
              {f === "hero" && stats && ` (${stats.heroImages || 0})`}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-50">
          <input
            type="text"
            placeholder="Search by filename or entity name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:ring-2 focus:ring-[#4e342e] focus:border-transparent"
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredImages.map((image) => (
          <div
            key={image.fileId}
            className={`bg-white rounded-lg shadow border overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
              image.isOrphaned ? "border-red-300" : "border-[#d7ccc8]"
            } ${
              selectedImage?.fileId === image.fileId
                ? "ring-2 ring-[#4e342e]"
                : ""
            }`}
            onClick={() => setSelectedImage(image)}
          >
            {/* Image Thumbnail */}
            <div className="aspect-square bg-gray-100 relative">
              <img
                src={`${API_URL}${image.url}`}
                alt={image.filename}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder-image.png";
                }}
              />
              {image.isOrphaned && (
                <div className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded">
                  Orphaned
                </div>
              )}
              {deletingId === image.fileId && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white">Deleting...</div>
                </div>
              )}
            </div>

            {/* Image Info */}
            <div className="p-2">
              <p
                className="text-xs text-gray-600 truncate"
                title={image.filename}
              >
                {image.filename}
              </p>
              <p className="text-xs text-gray-500">{formatBytes(image.size)}</p>

              {/* Associations */}
              {image.associations.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {image.associations.slice(0, 2).map((assoc, idx) => (
                    <span
                      key={idx}
                      className={`text-[10px] px-1.5 py-0.5 rounded ${getEntityTypeColor(
                        assoc.entityType,
                      )}`}
                      title={`${assoc.entityName} (${assoc.imageType})`}
                    >
                      {assoc.entityType.charAt(0).toUpperCase()}
                    </span>
                  ))}
                  {image.associations.length > 2 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                      +{image.associations.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredImages.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          No images found matching your criteria.
        </div>
      )}

      {/* Image Detail Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image Preview */}
            <div className="md:w-1/2 bg-gray-900 flex items-center justify-center p-4">
              <img
                src={`${API_URL}${selectedImage.url}`}
                alt={selectedImage.filename}
                className="max-w-full max-h-[60vh] object-contain"
              />
            </div>

            {/* Image Details */}
            <div className="md:w-1/2 p-6 overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-[#3e2723]">
                  Image Details
                </h3>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Filename */}
                <div>
                  <p className="text-sm text-gray-500">Filename</p>
                  <p className="text-sm font-medium text-[#3e2723] break-all">
                    {selectedImage.filename}
                  </p>
                </div>

                {/* File ID */}
                <div>
                  <p className="text-sm text-gray-500">File ID</p>
                  <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
                    {selectedImage.fileId}
                  </p>
                </div>

                {/* Size & Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Size</p>
                    <p className="text-sm font-medium">
                      {formatBytes(selectedImage.size)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="text-sm font-medium">
                      {selectedImage.contentType}
                    </p>
                  </div>
                </div>

                {/* Upload Date */}
                <div>
                  <p className="text-sm text-gray-500">Uploaded</p>
                  <p className="text-sm font-medium">
                    {formatDate(selectedImage.uploadDate)}
                  </p>
                </div>

                {/* Status */}
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      selectedImage.isOrphaned
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {selectedImage.isOrphaned
                      ? "Orphaned (Not linked)"
                      : "Linked"}
                  </span>
                </div>

                {/* Associations */}
                {selectedImage.associations.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Linked To</p>
                    <div className="space-y-2">
                      {selectedImage.associations.map((assoc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-gray-50 p-2 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${getEntityTypeColor(
                                assoc.entityType,
                              )}`}
                            >
                              {assoc.entityType}
                            </span>
                            <span className="text-sm font-medium text-[#3e2723]">
                              {assoc.entityName}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${getImageTypeColor(
                              assoc.imageType,
                            )}`}
                          >
                            {assoc.imageType}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Direct URL */}
                <div>
                  <p className="text-sm text-gray-500">Direct URL</p>
                  <a
                    href={`${API_URL}${selectedImage.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline break-all"
                  >
                    {`${API_URL}${selectedImage.url}`}
                  </a>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <a
                    href={`${API_URL}${selectedImage.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2 bg-[#4e342e] text-white text-center rounded-lg hover:bg-[#3e2723] transition-colors"
                  >
                    Open Full Size
                  </a>
                  <button
                    onClick={() => handleShareImage(selectedImage)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Share image"
                  >
                    {copiedId === selectedImage.fileId ? "✓ Copied!" : "Share"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
