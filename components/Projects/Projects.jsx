"use client";

import { useState, useEffect } from "react";
import ProjectCard from "./ProjectCard";
import ProjectFilter from "./ProjectFilter";
import FeaturedProjects from "../Home/FeaturedProjects";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const Projects = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState([{ value: "all", label: "All Work" }]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, categoriesRes] = await Promise.all([
          fetch(`${API_URL}/api/projects?limit=100`, {
            headers: { "Content-Type": "application/json" },
          }),
          fetch(`${API_URL}/api/categories?type=project`, {
            headers: { "Content-Type": "application/json" },
          }),
        ]);
        const projectsData = await projectsRes.json();
        setProjects(projectsData.data || []);

        const categoriesData = await categoriesRes.json();
        if (categoriesData.success && categoriesData.categories?.length) {
          setFilters([
            { value: "all", label: "All Work" },
            ...categoriesData.categories.map((c) => ({
              value: c.name.toLowerCase(),
              label: c.name,
            })),
          ]);
        }
      } catch {
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProjects = projects.filter((project) => {
    if (activeFilter === "all") return true;
    return project.category?.toLowerCase().includes(activeFilter.toLowerCase());
  });

  return (
    <div
      id="projects"
      className="py-16 md:py-24 bg-[#fcfaf6]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(-45deg, rgba(0,0,0,0.02) 0, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 5px), repeating-linear-gradient(45deg, rgba(0,0,0,0.02) 0, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 5px)",
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-center mb-4 text-[#4e342e]">
          Our Projects
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
          Showcase of our completed interior and exterior woodwork projects
          featuring pergolas, decking, gazebos, and custom installations.
        </p>
        <ProjectFilter
          filters={filters}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No projects found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isVisible={true}
              />
            ))}
          </div>
        )}
        <div className="text-center mb-16">
          <a
            href="/projects"
            className="inline-block px-8 py-3 text-amber-900 font-semibold border-2 border-amber-900 rounded-lg shadow-lg hover:bg-amber-900 hover:text-white transition duration-300 uppercase"
          >
            View More Projects
          </a>
        </div>
        <FeaturedProjects />
      </div>
    </div>
  );
};

export default Projects;
