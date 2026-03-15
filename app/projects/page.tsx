"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Project {
  id: string;
  name: string;
  slug: string;
  title: string;
  description?: string;
  category: string;
  image?: string;
  featured: boolean;
  primaryWood?: string;
  client?: string;
  location?: string;
  completionDate?: string;
  createdAt?: string;
  status?: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/projects`, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        if (data.success) {
          // Backend already filters by published status
          const publishedProjects = data.data || [];

          // Extract unique categories
          const uniqueCategories = [
            ...new Set(publishedProjects.map((p: Project) => p.category)),
          ].filter(Boolean) as string[];
          setCategories(uniqueCategories);

          setProjects(publishedProjects);
          filterProjects(publishedProjects, "all");
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filterProjects = (projectList: Project[], category: string): void => {
    let filtered = projectList;

    if (category !== "all") {
      filtered = filtered.filter((p: Project) => p.category === category);
    }

    setFilteredProjects(filtered);
  };

  const handleCategoryChange = (category: string): void => {
    setSelectedCategory(category);
    filterProjects(projects, category);
  };

  // Helper to format image URL
  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return null;
    // If it's a relative URL starting with /api, prepend API_URL
    if (imageUrl.startsWith("/api/")) {
      return `${API_URL}${imageUrl}`;
    }
    return imageUrl;
  };

  return (
    <div className="min-h-screen bg-[#fcfaf6] text-[#3e2723] font-sans antialiased">
      {/* PAGE HEADER / HERO SECTION */}
      <div className="bg-[#fcfaf6] py-12 md:py-16 border-b border-[#d7ccc8]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#4e342e] mb-4">
            Commissioned Projects
          </h1>
          <p className="text-gray-600 max-w-3xl">
            Explore our portfolio of bespoke commissions completed for
            discerning clients worldwide. Each project showcases the versatility
            and excellence of our master craftsmen.
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
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`text-xs font-semibold uppercase tracking-wider py-2 px-4 rounded-full transition duration-300 ${
                  selectedCategory === category
                    ? "bg-[#4e342e] text-white"
                    : "bg-[#fcfaf6] border border-[#d7ccc8] text-[#3e2723] hover:bg-[#4e342e] hover:text-white"
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PROJECTS GRID */}
      <div className="py-16 md:py-24 bg-[#fcfaf6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">
                No projects found in this category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="group rounded-lg overflow-hidden shadow-xl border border-[#d7ccc8] hover:shadow-2xl transition duration-500"
                >
                  <div className="relative overflow-hidden h-80">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        getImageUrl(project.image) ||
                        `https://placehold.co/500x400/B19478/FFFFFF?text=${encodeURIComponent(
                          project.name,
                        )}`
                      }
                      alt={project.name}
                      onError={(e) => {
                        // Fallback to placeholder on error
                        (e.target as HTMLImageElement).src =
                          `https://placehold.co/500x400/B19478/FFFFFF?text=${encodeURIComponent(
                            project.name,
                          )}`;
                      }}
                      onLoad={() => {}}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-[#4e342e]/60 opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col items-center justify-center text-white p-4">
                      <p className="text-lg font-semibold mb-4 text-center">
                        {project.title}
                      </p>
                      <a
                        href={`/projects/${project.slug}`}
                        className="px-6 py-2 bg-white text-[#4e342e] font-semibold rounded-lg hover:bg-gray-100 transition duration-300"
                      >
                        View Project
                      </a>
                    </div>
                  </div>
                  <div className="p-6 bg-white">
                    <span className="inline-block text-xs text-[#4e342e] font-semibold uppercase mb-2 tracking-widest bg-[#d7ccc8]/30 px-2 py-1 rounded">
                      {project.category}
                    </span>
                    <h3 className="text-xl font-bold font-serif text-[#3e2723] mb-2">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {project.description}
                    </p>
                    {project.client && (
                      <p className="text-xs text-gray-500 mt-2">
                        Client: {project.client}
                      </p>
                    )}
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
