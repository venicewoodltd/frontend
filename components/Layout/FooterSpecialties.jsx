"use client";

import { useState, useEffect } from "react";

const API_URL = "";

const FooterSpecialties = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/api/categories?type=product`);
        const data = await response.json();
        if (data.success) {
          setCategories(data.categories.filter((c) => c.isActive));
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div>
      <h4 className="font-semibold text-[#4e342e] mb-4 uppercase tracking-wider">
        Specialties
      </h4>
      <ul className="space-y-2">
        {categories.length === 0 ? (
          <li className="text-gray-400 text-sm">Loading...</li>
        ) : (
          categories.map((c) => (
            <li key={c.id}>
              <a
                href={`/products?category=${encodeURIComponent(c.name)}`}
                className="text-gray-600 hover:text-[#4e342e] transition duration-300"
              >
                {c.name}
              </a>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default FooterSpecialties;
