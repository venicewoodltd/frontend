"use client";

import { sanitizeHTML } from "@/lib/sanitize";

interface BlogPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  blog: {
    title: string;
    slug?: string;
    excerpt: string;
    content: string;
    category: string;
    featuredImage: string;
    featured: boolean;
    status?: string;
    author?: string;
    seoTags?: string;
    readingTime?: number;
  };
}

export default function BlogPreviewModal({
  isOpen,
  onClose,
  blog,
}: BlogPreviewProps) {
  if (!isOpen) return null;

  const API_URL = "";

  const getImageUrl = (imageId: string) => {
    if (!imageId) return "/placeholder-blog.svg";
    if (imageId.startsWith("http") || imageId.startsWith("data:"))
      return imageId;
    if (imageId.startsWith("/api/images/")) return `${API_URL}${imageId}`;
    return `${API_URL}/api/images/${imageId}`;
  };

  const calculateReadingTime = (content: string) => {
    const text = content.replace(/<[^>]*>/g, "");
    const wordCount = text
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    return Math.ceil(wordCount / 200);
  };

  const readingTime = blog.readingTime || calculateReadingTime(blog.content);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 backdrop-blur-sm bg-white/30 transition-opacity"
        onClick={onClose}
      />
      <div className="relative min-h-screen flex items-start justify-center p-4 pt-10">
        <div className="relative bg-[#fcfaf6] rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all border border-gray-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition"
          >
            <svg
              className="w-6 h-6 text-gray-600"
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

          <div className="absolute top-4 left-4 z-10 bg-[#4e342e] text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Preview Mode
          </div>

          <div className="p-0">
            {/* Featured Image */}
            <div className="aspect-[21/9] bg-white overflow-hidden rounded-t-xl">
              <img
                src={getImageUrl(blog.featuredImage)}
                alt={blog.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder-blog.svg";
                }}
              />
            </div>

            {/* Header */}
            <div className="px-8 pt-6 pb-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-[#4e342e]/10 text-[#4e342e] px-3 py-1 rounded-full text-sm font-medium capitalize">
                  {blog.category}
                </span>
                {blog.featured && (
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
                    Featured
                  </span>
                )}
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${blog.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                >
                  {blog.status === "published" ? "Published" : "Draft"}
                </span>
              </div>

              <h1 className="text-3xl font-serif font-bold text-[#3e2723] mb-4">
                {blog.title || "Blog Title"}
              </h1>

              <div className="flex items-center gap-4 text-sm text-[#5d4037] mb-6">
                <span className="flex items-center gap-1">
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  {blog.author || "Venice Wood Ltd"}
                </span>
                <span className="flex items-center gap-1">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {readingTime} min read
                </span>
              </div>

              {blog.excerpt && (
                <p className="text-lg text-[#5d4037] mb-6 leading-relaxed italic border-l-4 border-[#4e342e] pl-4">
                  {blog.excerpt}
                </p>
              )}
            </div>

            <div className="h-px bg-[#d7ccc8] mx-8" />

            {/* Content */}
            <div className="px-8 py-6">
              <div
                className="prose prose-lg max-w-none prose-headings:text-[#3e2723] prose-a:text-[#4e342e] prose-p:text-[#3e2723] text-[#3e2723]"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHTML(
                    (blog.content || "<p>No content provided</p>")
                      .split(/\n\n+/)
                      .filter((p: string) => p.trim())
                      .map(
                        (p: string) =>
                          `<p class="mb-4">${p.replace(/\n/g, "<br />")}</p>`,
                      )
                      .join(""),
                  ),
                }}
              />
            </div>

            {/* SEO Tags */}
            {blog.seoTags && (
              <div className="px-8 pb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">
                    SEO Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {blog.seoTags.split(",").map((tag, index) => (
                      <span
                        key={index}
                        className="bg-white px-3 py-1 rounded-full text-sm text-gray-600 border border-gray-200"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
