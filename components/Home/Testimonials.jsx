"use client";

import { useState, useEffect } from "react";
import TestimonialCard from "./TestimonialCard";

const API_URL = "";

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await fetch(`${API_URL}/api/testimonials`);
        const data = await response.json();
        if (data.success && data.data) setTestimonials(data.data);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  const getInitials = (name) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div
      id="testimonials"
      className="py-16 md:py-24 bg-[#fcfaf6]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(-45deg, rgba(0,0,0,0.02) 0, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 5px), repeating-linear-gradient(45deg, rgba(0,0,0,0.02) 0, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 5px)",
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-center mb-4 text-[#4e342e]">
          Voices of Our Patrons
        </h2>
        <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">
          Hear directly from our valued clients about their experience with
          VeniceWoodLtd
        </p>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading testimonials...</p>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">
              No testimonials yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={testimonial.id}
                testimonial={testimonial}
                initials={getInitials(testimonial.author)}
                delay={`${index * 0.2}s`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Testimonials;
