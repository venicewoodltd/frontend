"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { sanitizeHTML } from "@/lib/sanitize";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Blog {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image?: string;
  author?: string;
  readingTime?: number;
  views?: number;
  publishedAt?: string;
}

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/blogs/${slug}`);

        const data = await response.json();
        if (data.success) {
          // Prevent public access to draft blogs
          if (data.data.status === "draft") {
            setError("Blog not found");
            return;
          }
          setBlog(data.data);
        } else {
          setError(data.message || "Blog not found");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load blog");
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfaf6] flex items-center justify-center">
        <p className="text-gray-600">Loading blog...</p>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-[#fcfaf6] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#4e342e] mb-4">
            Blog Not Found
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/blog"
            className="inline-block px-6 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723]"
          >
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfaf6] text-[#3e2723] font-sans">
      {/* ARTICLE HEADER */}
      <div className="bg-[#fcfaf6] py-12 md:py-16 border-b border-[#d7ccc8]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <span className="inline-block text-xs font-semibold text-[#4e342e] uppercase mb-4 tracking-widest bg-[#d7ccc8]/30 px-3 py-1 rounded">
            {blog.category}
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#4e342e] mb-4">
            {blog.title}
          </h1>

          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div>
              <p className="font-semibold text-[#3e2723]">
                {blog.author || "Venice Wood Ltd"}
              </p>
              <p className="text-xs">
                {blog.publishedAt
                  ? new Date(blog.publishedAt).toLocaleDateString()
                  : "Recently"}
              </p>
            </div>
            <div className="pl-6 border-l border-[#d7ccc8]/50">
              <p className="text-xs text-gray-500">Reading Time</p>
              <p className="font-semibold text-[#3e2723]">
                {blog.readingTime || 0} minutes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURED IMAGE */}
      {blog.image && (
        <div className="bg-white py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                blog.image.startsWith("http")
                  ? blog.image
                  : `${API_URL}${blog.image}`
              }
              alt={blog.title}
              className="w-full rounded-lg shadow-2xl border border-[#d7ccc8]"
            />
          </div>
        </div>
      )}

      {/* ARTICLE CONTENT */}
      <div className="py-12 md:py-16 bg-[#fcfaf6]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div
            className="prose prose-lg max-w-none text-gray-700"
            dangerouslySetInnerHTML={{
              __html: sanitizeHTML(
                // If content contains HTML tags, render as-is (WYSIWYG output)
                // Otherwise, convert plain text to paragraphs (legacy content)
                /<[a-z][\s\S]*>/i.test(blog.content)
                  ? blog.content
                  : blog.content
                      .split(/\n\n+/)
                      .filter((p: string) => p.trim())
                      .map(
                        (p: string) => `<p>${p.replace(/\n/g, "<br />")}</p>`,
                      )
                      .join(""),
              ),
            }}
            style={{
              fontSize: "17px",
              lineHeight: "1.9",
            }}
          />

          {/* ARTICLE FOOTER */}
          <div className="mt-12 pt-8 border-t border-[#d7ccc8]">
            <div className="flex flex-wrap gap-3 mb-8">
              <span className="inline-block text-xs font-semibold text-white bg-[#4e342e] px-3 py-1 rounded-full">
                {blog.category}
              </span>
            </div>

            <div className="pt-8 border-t border-[#d7ccc8]">
              <p className="text-sm text-gray-600 mb-4">Share this article:</p>
              <div className="flex gap-4">
                {/* Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}&quote=${encodeURIComponent(`${blog.title} - ${blog.excerpt}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-full border border-[#d7ccc8] hover:bg-[#4e342e]/10 transition duration-300"
                  aria-label="Share on Facebook"
                >
                  <svg
                    className="w-5 h-5 text-[#4e342e]"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-3 7h-2c-.551 0-1 .449-1 1v2h3l-.38 3h-2.62v7h-3v-7h-2v-3h2v-2c0-1.657 1.343-3 3-3h3v3z"></path>
                  </svg>
                </a>
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${blog.title}\n\n${blog.excerpt}\n\n${typeof window !== "undefined" ? window.location.href : ""}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-full border border-[#d7ccc8] hover:bg-[#4e342e]/10 transition duration-300"
                  aria-label="Share on WhatsApp"
                >
                  <svg
                    className="w-5 h-5 text-[#4e342e]"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
                {/* Instagram - copy link to clipboard since Instagram doesn't support direct URL sharing */}
                <button
                  onClick={() => {
                    const shareText = `${blog.title}\n\n${blog.excerpt}\n\n${typeof window !== "undefined" ? window.location.href : ""}`;
                    navigator.clipboard.writeText(shareText);
                    alert(
                      "Blog link and details copied to clipboard! You can paste it on Instagram.",
                    );
                  }}
                  className="p-3 rounded-full border border-[#d7ccc8] hover:bg-[#4e342e]/10 transition duration-300"
                  aria-label="Copy for Instagram"
                >
                  <svg
                    className="w-5 h-5 text-[#4e342e]"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA SECTION */}
      <div className="py-16 md:py-20 bg-[#4e342e] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
            Inspired to Commission Your Project?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Let&apos;s discuss how we can bring your vision to life.
          </p>
          <Link
            href="/inquire"
            className="inline-block px-10 py-4 bg-white text-[#4e342e] font-semibold rounded-lg hover:bg-gray-100 transition duration-300 uppercase tracking-widest"
          >
            Start Your Commission
          </Link>
        </div>
      </div>

      {/* FOOTER */}
      <div className="py-8 bg-white border-t border-[#d7ccc8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link
            href="/blog"
            className="inline-block text-[#4e342e] hover:text-[#3e2723] font-semibold"
          >
            ← Back to Blog
          </Link>
        </div>
      </div>
    </div>
  );
}
