"use client";

import { useState, useEffect } from "react";
import CircularProgress from "@/components/ui/CircularProgress";
import { useToast } from "@/components/ui/Toast";

const API_URL = "";

export default function HeroSettingsTab() {
  const [heroImages, setHeroImages] = useState([]);
  const [carouselSettings, setCarouselSettings] = useState({
    interval: 5000,
    transitionType: "fade",
  });
  const [heroText, setHeroText] = useState({
    heroTitle: "Premium Bespoke Woodwork",
    heroSubtitle:
      "Handcrafted wooden furniture and architectural millwork in Mauritius. Excellence in every detail.",
    titleColor: "#4e342e",
    subtitleColor: "#1f2937",
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [savingText, setSavingText] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingInterval, setEditingInterval] = useState(false);
  const [editingText, setEditingText] = useState(false);
  const { showToast } = useToast();

  const adminToken =
    typeof window !== "undefined" ? localStorage.getItem("adminToken") : "";

  // Fetch hero settings and images
  const fetchHeroSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/hero`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch hero settings");

      const data = await response.json();
      if (data.success) {
        setHeroImages(data.images || []);
        setCarouselSettings(
          data.settings || { interval: 5000, transitionType: "fade" },
        );
        if (data.heroText) {
          setHeroText({
            heroTitle: data.heroText.heroTitle || "Premium Bespoke Woodwork",
            heroSubtitle:
              data.heroText.heroSubtitle ||
              "Handcrafted wooden furniture and architectural millwork in Mauritius. Excellence in every detail.",
            titleColor: data.heroText.titleColor || "#4e342e",
            subtitleColor: data.heroText.subtitleColor || "#1f2937",
          });
        }
      }
    } catch (err) {
      setError(`Error loading hero settings: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeroSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle image upload
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      setError("");
      const formData = new FormData();

      for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i]);
      }

      // Use XHR for progress tracking
      const token =
        typeof window !== "undefined" ? localStorage.getItem("adminToken") : "";
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        });
        xhr.addEventListener("load", () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && data.success) {
              setSuccess(`${files.length} image(s) uploaded successfully!`);
              showToast({
                type: "success",
                title: "Images Uploaded",
                message: `${files.length} image(s) uploaded successfully!`,
              });
              fetchHeroSettings();
              e.target.value = "";
              setTimeout(() => setSuccess(""), 3000);
              resolve(data);
            } else {
              reject(new Error(data.message || "Upload failed"));
            }
          } catch {
            reject(new Error("Failed to parse response"));
          }
        });
        xhr.addEventListener("error", () =>
          reject(new Error("Upload request failed")),
        );
        xhr.open("POST", `${API_URL}/api/admin/hero/upload`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.send(formData);
      });
    } catch (err) {
      setError(`Error uploading images: ${err.message}`);
      showToast({
        type: "error",
        title: "Upload Failed",
        message: err.message,
      });
      console.error(err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle image deletion
  const handleDeleteImage = async (fileId) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      setError("");
      const response = await fetch(
        `${API_URL}/api/admin/hero/image/${fileId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        setSuccess("Image deleted successfully!");
        showToast({
          type: "success",
          title: "Image Deleted",
          message: "Image deleted successfully!",
        });
        fetchHeroSettings();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Deletion failed");
        showToast({
          type: "error",
          title: "Delete Failed",
          message: data.message || "Deletion failed",
        });
      }
    } catch (err) {
      setError(`Error deleting image: ${err.message}`);
      showToast({ type: "error", title: "Delete Error", message: err.message });
      console.error(err);
    }
  };

  // Handle carousel settings update
  const handleUpdateSettings = async () => {
    try {
      setError("");
      const response = await fetch(`${API_URL}/api/admin/hero/settings`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(carouselSettings),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess("Carousel settings updated successfully!");
        showToast({
          type: "success",
          title: "Settings Updated",
          message: "Carousel settings updated successfully!",
        });
        setEditingInterval(false);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Update failed");
        showToast({
          type: "error",
          title: "Update Failed",
          message: data.message || "Update failed",
        });
      }
    } catch (err) {
      setError(`Error updating settings: ${err.message}`);
      showToast({ type: "error", title: "Update Error", message: err.message });
      console.error(err);
    }
  };

  // Handle hero text update
  const handleUpdateText = async () => {
    try {
      setSavingText(true);
      setError("");
      const response = await fetch(`${API_URL}/api/admin/hero/text`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(heroText),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess("Hero text updated successfully!");
        showToast({
          type: "success",
          title: "Hero Text Updated",
          message: "Hero text updated successfully!",
        });
        setEditingText(false);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Update failed");
        showToast({
          type: "error",
          title: "Update Failed",
          message: data.message || "Update failed",
        });
      }
    } catch (err) {
      setError(`Error updating hero text: ${err.message}`);
      showToast({ type: "error", title: "Update Error", message: err.message });
      console.error(err);
    } finally {
      setSavingText(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading hero settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Error and Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Hero Text Content */}
      <div className="bg-white p-6 rounded-lg border border-[#d7ccc8]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-serif font-bold text-[#4e342e]">
            Hero Text
          </h3>
          {!editingText && (
            <button
              onClick={() => setEditingText(true)}
              className="px-4 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition"
            >
              Edit
            </button>
          )}
        </div>

        {editingText ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={heroText.heroTitle}
                onChange={(e) =>
                  setHeroText({ ...heroText, heroTitle: e.target.value })
                }
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:ring-[#4e342e] focus:border-[#4e342e] transition"
                placeholder="e.g. Premium Bespoke Woodwork"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subtitle
              </label>
              <textarea
                value={heroText.heroSubtitle}
                onChange={(e) =>
                  setHeroText({ ...heroText, heroSubtitle: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:ring-[#4e342e] focus:border-[#4e342e] transition resize-none"
                placeholder="e.g. Handcrafted wooden furniture..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={heroText.titleColor || "#4e342e"}
                    onChange={(e) =>
                      setHeroText({ ...heroText, titleColor: e.target.value })
                    }
                    className="w-12 h-10 cursor-pointer rounded border border-[#d7ccc8]"
                  />
                  <input
                    type="text"
                    value={heroText.titleColor || "#4e342e"}
                    onChange={(e) =>
                      setHeroText({ ...heroText, titleColor: e.target.value })
                    }
                    className="flex-1 px-4 py-2 border border-[#d7ccc8] rounded-lg focus:ring-[#4e342e] focus:border-[#4e342e] transition font-mono text-sm"
                    placeholder="#4e342e"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subtitle Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={heroText.subtitleColor || "#1f2937"}
                    onChange={(e) =>
                      setHeroText({
                        ...heroText,
                        subtitleColor: e.target.value,
                      })
                    }
                    className="w-12 h-10 cursor-pointer rounded border border-[#d7ccc8]"
                  />
                  <input
                    type="text"
                    value={heroText.subtitleColor || "#1f2937"}
                    onChange={(e) =>
                      setHeroText({
                        ...heroText,
                        subtitleColor: e.target.value,
                      })
                    }
                    className="flex-1 px-4 py-2 border border-[#d7ccc8] rounded-lg focus:ring-[#4e342e] focus:border-[#4e342e] transition font-mono text-sm"
                    placeholder="#1f2937"
                  />
                </div>
              </div>
            </div>
            {/* Color Preview */}
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">Preview</p>
              <h3
                className="text-2xl font-serif font-bold mb-1"
                style={{ color: heroText.titleColor || "#4e342e" }}
              >
                {heroText.heroTitle || "Title preview"}
              </h3>
              <p
                className="text-sm"
                style={{ color: heroText.subtitleColor || "#1f2937" }}
              >
                {heroText.heroSubtitle || "Subtitle preview"}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleUpdateText}
                disabled={savingText}
                className="px-6 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition disabled:opacity-50"
              >
                {savingText ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setEditingText(false);
                  fetchHeroSettings(); // revert to saved values
                }}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Title</p>
              <p className="text-lg font-semibold text-[#4e342e]">
                {heroText.heroTitle}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Subtitle</p>
              <p className="text-gray-800">{heroText.heroSubtitle}</p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-lg border border-[#d7ccc8]">
        <h3 className="text-2xl font-serif font-bold text-[#4e342e] mb-6">
          Upload Hero Images
        </h3>
        <p className="text-gray-600 mb-4">
          Upload up to 5 images. They will appear in the carousel on the
          homepage. Supported formats: JPEG, PNG, WebP (max 10MB each).
        </p>

        <div className="border-2 border-dashed border-[#d7ccc8] rounded-lg p-8 text-center hover:border-[#4e342e] transition cursor-pointer">
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageUpload}
            disabled={uploading}
            className="hidden"
            id="heroImageUpload"
          />
          <label htmlFor="heroImageUpload" className="cursor-pointer block">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-[#4e342e]"
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
            <div className="text-[#4e342e] font-semibold">
              {uploading ? (
                <span className="flex flex-col items-center gap-2">
                  <CircularProgress
                    progress={uploadProgress}
                    size={50}
                    strokeWidth={4}
                  />
                  <span>Uploading... {uploadProgress}%</span>
                </span>
              ) : (
                "Click to upload or drag and drop"
              )}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              PNG, JPG, WebP up to 10MB
            </p>
          </label>
        </div>
      </div>

      {/* Current Images */}
      <div className="bg-white p-6 rounded-lg border border-[#d7ccc8]">
        <h3 className="text-2xl font-serif font-bold text-[#4e342e] mb-6">
          Hero Images ({heroImages.length})
        </h3>

        {heroImages.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No hero images yet. Upload some to get started.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {heroImages.map((image) => (
              <div
                key={image._id}
                className="group relative rounded-lg overflow-hidden border border-[#d7ccc8] hover:border-[#4e342e] transition"
              >
                {/* Using standard img tag for dynamic image URLs from API */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${API_URL}/api/admin/hero/image/${image._id}`}
                  alt={image.filename}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => handleDeleteImage(image._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-xs text-gray-500 p-2 bg-gray-50">
                  {image.filename}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Carousel Settings */}
      <div className="bg-white p-6 rounded-lg border border-[#d7ccc8]">
        <h3 className="text-2xl font-serif font-bold text-[#4e342e] mb-6">
          Carousel Settings
        </h3>

        <div className="space-y-6">
          {/* Interval Setting */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Slide Interval (milliseconds)
            </label>
            {editingInterval ? (
              <div className="flex gap-3">
                <input
                  type="number"
                  min="1000"
                  max="30000"
                  step="1000"
                  value={carouselSettings.interval}
                  onChange={(e) =>
                    setCarouselSettings({
                      ...carouselSettings,
                      interval: parseInt(e.target.value),
                    })
                  }
                  className="flex-1 px-4 py-2 border border-[#d7ccc8] rounded-lg focus:ring-[#4e342e] focus:border-[#4e342e] transition"
                />
                <button
                  onClick={handleUpdateSettings}
                  className="px-6 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingInterval(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-lg font-semibold text-[#4e342e]">
                  {carouselSettings.interval}ms (
                  {(carouselSettings.interval / 1000).toFixed(1)}s)
                </span>
                <button
                  onClick={() => setEditingInterval(true)}
                  className="px-4 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition"
                >
                  Edit
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              How long each slide is displayed (1-30 seconds)
            </p>
          </div>

          {/* Transition Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Transition Type
            </label>
            <select
              value={carouselSettings.transitionType}
              onChange={(e) =>
                setCarouselSettings({
                  ...carouselSettings,
                  transitionType: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:ring-[#4e342e] focus:border-[#4e342e] transition"
            >
              <option value="fade">Fade</option>
              <option value="slide-left">Slide Left</option>
              <option value="slide-right">Slide Right</option>
              <option value="slide-up">Slide Up</option>
              <option value="slide-down">Slide Down</option>
              <option value="zoom-in">Zoom In</option>
              <option value="zoom-out">Zoom Out</option>
              <option value="morph">Morph</option>
              <option value="flip">Flip</option>
            </select>
          </div>

          {/* Save Button */}
          {!editingInterval && (
            <button
              onClick={handleUpdateSettings}
              className="w-full px-6 py-3 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition font-semibold"
            >
              Update Carousel Settings
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
