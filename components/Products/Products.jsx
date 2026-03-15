"use client";

import { useState, useEffect } from "react";
import ProductCard from "./ProductCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/api/products?limit=6`, {
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        setProducts(data.data || []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div id="products" className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-center mb-12 text-[#4e342e]">
          Our Specializations
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
          Expert craftsmanship in interior and exterior woodwork. From bespoke
          furniture to structural installations, we deliver excellence in every
          project.
        </p>
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No products available at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                delay={`${index * 0.2}s`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
