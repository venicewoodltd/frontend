"use client";

import { useState, useEffect } from "react";
import FeaturedProjectCard from "./FeaturedProjectCard";

const API_URL = "";

const FeaturedProjects = () => {
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProjects = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/projects?limit=6&featured=true`,
          { headers: { "Content-Type": "application/json" } },
        );
        const data = await response.json();
        setFeaturedProjects(data.data || []);
      } catch {
        setFeaturedProjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedProjects();
  }, []);

  return (
    <div className="mt-12">
      <h3 className="text-3xl font-serif font-bold text-center mb-8 text-gray-800">
        Signature Works
      </h3>
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading featured projects...</p>
        </div>
      ) : featuredProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No featured projects available.</p>
        </div>
      ) : (
        <div
          className="flex space-x-6 overflow-x-auto snap-x snap-mandatory pb-4"
          style={{ scrollBehavior: "smooth" }}
        >
          {featuredProjects.map((project) => (
            <FeaturedProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeaturedProjects;
