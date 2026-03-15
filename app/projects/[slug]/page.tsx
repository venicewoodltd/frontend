"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface ProjectImage {
  id: string;
  type: string;
  url: string;
  fileName: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  category: string;
  image?: string;
  featured: boolean;
  primaryWood?: string;
  client?: string;
  dimensions?: Record<string, string | number>;
  materials?: Array<string>;
  specifications?: Array<{ key: string; value: string }>;
  gallery?: ProjectImage[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/projects/${slug}`);

        const data = await response.json();
        if (data.success) {
          // Prefix image URLs with API_URL
          const projectData = data.data;
          if (projectData.image && projectData.image.startsWith("/api/")) {
            projectData.image = `${API_URL}${projectData.image}`;
          }
          if (projectData.gallery) {
            projectData.gallery = projectData.gallery.map(
              (img: ProjectImage) => ({
                ...img,
                url: img.url.startsWith("/api/")
                  ? `${API_URL}${img.url}`
                  : img.url,
              }),
            );
          }
          // Prevent public access to draft projects
          if (projectData.status === "draft") {
            setError("Project not found");
            return;
          }
          setProject(projectData);
        } else {
          setError(data.message || "Project not found");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load project");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfaf6] flex items-center justify-center">
        <p className="text-gray-600">Loading project...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#fcfaf6] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#4e342e] mb-4">
            Project Not Found
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/projects"
            className="inline-block px-6 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723]"
          >
            Back to Projects
          </a>
        </div>
      </div>
    );
  }

  // Get gallery images
  const galleryImages = project.gallery;

  return (
    <div className="min-h-screen bg-[#fcfaf6] text-[#3e2723] font-sans">
      {/* HERO IMAGE */}
      <div className="relative h-96 md:h-125 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            project.image ||
            `https://placehold.co/1600x600/B19478/FFFFFF?text=${encodeURIComponent(
              project.name,
            )}`
          }
          alt={project.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r from-[#4e342e]/70 to-transparent flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-3">
              {project.name}
            </h1>
            <p className="text-lg text-white/90">{project.title}</p>
          </div>
        </div>
      </div>

      {/* PROJECT OVERVIEW */}
      <div className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="border-l-4 border-[#4e342e] pl-4">
              <p className="text-sm text-gray-600 mb-1">Client</p>
              <p className="text-lg font-semibold text-[#3e2723]">
                {project.client || "Private Residence"}
              </p>
            </div>
            <div className="border-l-4 border-[#4e342e] pl-4">
              <p className="text-sm text-gray-600 mb-1">Category</p>
              <p className="text-lg font-semibold text-[#3e2723] capitalize">
                {project.category}
              </p>
            </div>
            <div className="border-l-4 border-[#4e342e] pl-4">
              <p className="text-sm text-gray-600 mb-1">Primary Wood</p>
              <p className="text-lg font-semibold text-[#3e2723]">
                {project.primaryWood || "Various"}
              </p>
            </div>
          </div>

          <div className="prose prose-sm max-w-3xl text-gray-700 leading-relaxed space-y-4">
            <p>{project.description}</p>
            {project.longDescription && (
              <div className="whitespace-pre-line">
                {project.longDescription}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PROJECT GALLERY */}
      {galleryImages && galleryImages.length > 0 && (
        <div className="py-12 md:py-16 bg-[#fcfaf6]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-serif font-bold text-[#4e342e] mb-8">
              Project Gallery
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {galleryImages.map((image) => (
                <div
                  key={image.id}
                  className="rounded-lg overflow-hidden shadow-xl border border-[#d7ccc8]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.fileName}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PROJECT DETAILS */}
      {((project.specifications && project.specifications.length > 0) ||
        (project.materials && project.materials.length > 0)) && (
        <div className="py-12 md:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-serif font-bold text-[#4e342e] mb-8">
              Project Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {project.specifications && project.specifications.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-[#3e2723] mb-4">
                    Specifications
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    {project.specifications.map((spec, idx) => (
                      <li
                        key={idx}
                        className="flex justify-between border-b border-[#d7ccc8]/50 pb-2"
                      >
                        <span className="font-semibold">{spec.key}:</span>
                        <span>{spec.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {project.materials && project.materials.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-[#3e2723] mb-4">
                    Materials
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    {project.materials.map((material, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#4e342e] font-bold mt-1">•</span>
                        <span>{material}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CTA SECTION */}
      <div className="py-16 md:py-20 bg-[#fcfaf6]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#4e342e] mb-4">
            Inspired to Commission Your Project?
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Let&apos;s discuss how we can bring your vision to life.
          </p>
          <Link
            href="/inquire"
            className="inline-block px-10 py-4 bg-[#4e342e] text-white font-semibold rounded-lg hover:bg-[#3e2723] transition duration-300 uppercase tracking-widest"
          >
            Start Your Commission
          </Link>
        </div>
      </div>
    </div>
  );
}
