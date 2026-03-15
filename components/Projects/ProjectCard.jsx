"use client";

import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const ProjectCard = ({ project, isVisible }) => {
  const { id, slug, title, image } = project;
  const imageUrl = image
    ? image.startsWith("http")
      ? image
      : `${API_URL}${image}`
    : null;

  return (
    <Link
      href={`/projects/${slug || id}`}
      className={`relative group rounded-lg overflow-hidden shadow-md border border-amber-200/50 transition-opacity duration-300 cursor-pointer block ${!isVisible ? "hidden" : "block"}`}
    >
      <img
        src={imageUrl}
        alt={title}
        className="w-full h-32 md:h-48 object-cover transition duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-amber-900/70 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center p-2">
        <p className="text-sm text-center text-white font-medium">{title}</p>
      </div>
    </Link>
  );
};

export default ProjectCard;
