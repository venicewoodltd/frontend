"use client";

import Link from "next/link";

const API_URL = "";

const BlogCard = ({ post, delay }) => {
  const { id, slug, title, category, description, excerpt, image } = post;
  const imageUrl = image
    ? image.startsWith("http")
      ? image
      : `${API_URL}${image}`
    : null;

  return (
    <div
      className="bg-amber-50 rounded-xl shadow-2xl overflow-hidden hover:shadow-amber-900/20 transition duration-500 border border-amber-200"
      style={{ transitionDelay: delay }}
    >
      {imageUrl && (
        <img src={imageUrl} alt={title} className="w-full h-48 object-cover" />
      )}
      <div className="p-6">
        {category && (
          <span className="text-xs font-semibold text-amber-900 uppercase tracking-wider mb-1 block">
            {category}
          </span>
        )}
        <h3 className="text-xl font-bold font-serif text-gray-800 mb-3">
          {title}
        </h3>
        <p className="text-sm text-gray-600">{excerpt || description}</p>
        <Link
          href={`/blog/${slug || id}`}
          className="mt-4 inline-block text-amber-900 hover:text-gray-800 font-semibold text-sm"
        >
          Read Article &rarr;
        </Link>
      </div>
    </div>
  );
};

export default BlogCard;
