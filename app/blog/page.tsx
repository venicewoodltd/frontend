"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Blog {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  image?: string;
  readingTime?: number;
  views?: number;
  publishedAt?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

const API_URL = "";

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/api/categories?type=blog`);
        const data = await response.json();
        if (data.success) {
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch blogs on mount
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/blogs`, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        if (data.success) {
          setBlogs(data.data || []);
          filterBlogs(data.data || [], "all");
        }
      } catch (error) {
        console.error("Failed to fetch blogs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const filterBlogs = (blogList: Blog[], category: string): void => {
    let filtered = blogList;

    if (category !== "all") {
      filtered = filtered.filter((b: Blog) => b.category === category);
    }

    setFilteredBlogs(filtered);
  };

  const handleCategoryChange = (category: string): void => {
    setSelectedCategory(category);
    filterBlogs(blogs, category);
  };

  return (
    <div className="min-h-screen bg-[#fcfaf6] text-[#3e2723] font-sans antialiased">
      {/* PAGE HEADER / HERO SECTION */}
      <div className="bg-[#fcfaf6] py-12 md:py-16 border-b border-[#d7ccc8]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#4e342e] mb-4">
            The Carver&apos;s Blog
          </h1>
          <p className="text-gray-600 max-w-3xl">
            Explore articles on the history of joinery, rare timber species,
            design philosophy, and our commitment to sustainable craftsmanship.
            Learn from our masters.
          </p>
        </div>
      </div>

      {/* FILTERS SECTION */}
      <div className="bg-white border-b border-[#d7ccc8] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => handleCategoryChange("all")}
              className={`text-xs font-semibold uppercase tracking-wider py-2 px-4 rounded-full transition duration-300 ${
                selectedCategory === "all"
                  ? "bg-[#4e342e] text-white"
                  : "bg-[#fcfaf6] border border-[#d7ccc8] text-[#3e2723] hover:bg-[#4e342e] hover:text-white"
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.name)}
                className={`text-xs font-semibold uppercase tracking-wider py-2 px-4 rounded-full transition duration-300 ${
                  selectedCategory === category.name
                    ? "bg-[#4e342e] text-white"
                    : "bg-[#fcfaf6] border border-[#d7ccc8] text-[#3e2723] hover:bg-[#4e342e] hover:text-white"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* BLOG POSTS GRID */}
      <div className="py-16 md:py-24 bg-[#fcfaf6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading blog posts...</p>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">
                No blog posts found in this category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBlogs.map((blog) => (
                <div
                  key={blog.id}
                  className="bg-white rounded-xl shadow-2xl overflow-hidden hover:shadow-lg border border-[#d7ccc8] transition duration-300"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      blog.image
                        ? blog.image.startsWith("http")
                          ? blog.image
                          : `${API_URL}${blog.image}`
                        : `https://placehold.co/400x250/A1887F/FFFFFF?text=${encodeURIComponent(
                            blog.title,
                          )}`
                    }
                    alt={blog.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <span className="text-xs font-semibold text-[#4e342e] uppercase mb-2 tracking-widest bg-[#d7ccc8]/30 px-2 py-1 rounded inline-block">
                      {blog.category}
                    </span>
                    <p className="text-xs text-gray-500 mb-3">
                      {blog.readingTime || 0} min read
                    </p>
                    <h3 className="text-xl font-bold font-serif text-[#3e2723] mb-2">
                      {blog.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {blog.excerpt}
                    </p>
                    <Link
                      href={`/blog/${blog.slug}`}
                      className="inline-block text-[#4e342e] hover:text-[#3e2723] font-semibold text-sm"
                    >
                      Read Article →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA SECTION */}
      <div className="py-16 md:py-20 bg-[#4e342e] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
            Ready to Commission Your Project?
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
    </div>
  );
}
