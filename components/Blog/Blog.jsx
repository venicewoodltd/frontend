"use client";

import { useState, useEffect } from "react";
import BlogCard from "./BlogCard";

const API_URL = "";

const Blog = () => {
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_URL}/api/blogs?limit=3&status=published`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const data = await response.json();
        if (data.success) {
          setBlogPosts(data.data || []);
        } else {
          setBlogPosts(data.data || data || []);
        }
      } catch {
        setBlogPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  return (
    <div id="blog" className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-center mb-4 text-[#4e342e]">
          Insights &amp; Inspiration (The Carvers Blog)
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-4xl mx-auto">
          Explore articles on the history of joinery, rare timber species,
          design philosophy, and our commitment to sustainable craftsmanship.
        </p>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading blog posts...</p>
          </div>
        ) : blogPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No blog posts published yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <BlogCard key={post.id} post={post} delay={`${index * 0.2}s`} />
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <a
            href="/blog"
            className="inline-block px-8 py-3 text-amber-900 font-semibold border-2 border-amber-900 rounded-lg shadow-lg hover:bg-amber-900 hover:text-white transition duration-300 uppercase"
          >
            Browse All Articles
          </a>
        </div>
      </div>
    </div>
  );
};

export default Blog;
