"use client";

import Link from "next/link";

const API_URL = "";

const FeaturedProjectCard = ({ project }) => {
  const { id, slug, title, description, image } = project;
  const imageUrl = image
    ? image.startsWith("http")
      ? image
      : `${API_URL}${image}`
    : null;

  return (
    <Link
      href={`/projects/${slug || id}`}
      className="flex-shrink-0 w-80 md:w-96 snap-center bg-white rounded-xl shadow-xl overflow-hidden border border-amber-200 cursor-pointer hover:shadow-2xl transition-shadow duration-300 block"
    >
      <img src={imageUrl} alt={title} className="w-full h-64 object-cover" />
      <div className="p-4">
        <h4 className="text-xl font-serif text-amber-900">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );
};

export default FeaturedProjectCard;
