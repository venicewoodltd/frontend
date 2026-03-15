"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useProducts } from "@/lib/graphql";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

interface Category {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  image?: string;
  featured: boolean;
  createdAt?: string;
}

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const { getProducts } = useProducts();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(
    categoryParam || "all",
  );
  const [sortBy, setSortBy] = useState("all");

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/api/categories?type=product`);
        const data = await response.json();
        if (data.success) {
          setCategories(data.categories.filter((c: Category) => c.isActive));
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const result = await getProducts(100);
        const productList = result?.products || [];
        setProducts(productList);
        filterAndSort(productList, selectedCategory, "all");
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [getProducts]);

  const filterAndSort = (
    productList: Product[],
    category: string,
    sort: string,
  ): void => {
    let filtered = productList;

    // Filter by category
    if (category !== "all") {
      filtered = filtered.filter(
        (p: Product) => p.category.toLowerCase() === category.toLowerCase(),
      );
    }

    // Sort
    const sorted = [...filtered];
    if (sort === "newest") {
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
    } else if (sort === "oldest") {
      sorted.sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime(),
      );
    } else if (sort === "featured") {
      sorted.sort((a, b) => {
        if (a.featured === b.featured) return 0;
        return a.featured ? -1 : 1;
      });
    }
    // "all" sort keeps original order

    setFilteredProducts(sorted);
  };

  const handleCategoryChange = (category: string): void => {
    setSelectedCategory(category);
    filterAndSort(products, category, sortBy);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const sort = e.target.value;
    setSortBy(sort);
    filterAndSort(products, selectedCategory, sort);
  };

  return (
    <div className="min-h-screen bg-[#fcfaf6] text-[#3e2723] font-sans">
      {/* PAGE HEADER / HERO SECTION */}
      <div className="bg-[#fcfaf6] py-12 md:py-16 border-b border-[#d7ccc8]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#4e342e] mb-4">
            Our Exclusive Collection
          </h1>
          <p className="text-gray-600 max-w-3xl">
            Discover our curated selection of bespoke furniture and
            architectural elements. Each piece is meticulously crafted from the
            worlds finest sustainably sourced timber, combining traditional
            mastery with contemporary design.
          </p>
        </div>
      </div>

      {/* FILTERS SECTION */}
      <div className="bg-white border-b border-[#d7ccc8] py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleCategoryChange("all")}
                className={`text-xs font-semibold uppercase tracking-wider py-2 px-4 rounded-full transition duration-300 ${
                  selectedCategory === "all"
                    ? "bg-[#4e342e] text-white"
                    : "bg-[#fcfaf6] border border-[#d7ccc8] text-[#3e2723] hover:bg-[#4e342e] hover:text-white"
                }`}
              >
                All Products
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.name)}
                  className={`text-xs font-semibold uppercase tracking-wider py-2 px-4 rounded-full transition duration-300 ${
                    selectedCategory.toLowerCase() ===
                    category.name.toLowerCase()
                      ? "bg-[#4e342e] text-white"
                      : "bg-[#fcfaf6] border border-[#d7ccc8] text-[#3e2723] hover:bg-[#4e342e] hover:text-white"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="w-full md:w-auto">
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="w-full md:w-48 px-4 py-2 border border-[#d7ccc8] rounded-lg text-[#3e2723] bg-[#fcfaf6] focus:ring-[#4e342e] focus:border-[#4e342e] transition duration-300"
              >
                <option value="featured">Featured</option>
                <option value="all">All</option>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCTS GRID */}
      <div className="py-16 md:py-24 bg-[#fcfaf6]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <p className="text-[#3e2723] text-lg">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex justify-center items-center py-16">
              <p className="text-[#3e2723] text-lg">
                No products found in this category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-2xl overflow-hidden hover:shadow-lg border border-[#d7ccc8] transition duration-500"
                >
                  <div className="relative overflow-hidden h-56">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={
                          product.image.startsWith("http")
                            ? product.image
                            : `${API_URL}${product.image}`
                        }
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-110 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                    {product.featured && (
                      <span className="absolute top-4 right-4 bg-[#4e342e] text-white px-3 py-1 rounded-full text-xs font-bold">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    <p className="text-xs text-[#4e342e] font-semibold uppercase mb-2 tracking-widest">
                      {product.category}
                    </p>
                    <h3 className="text-xl font-bold font-serif text-[#3e2723] mb-3">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {product.description || "No description available"}
                    </p>
                    <div className="flex justify-end items-center">
                      <a
                        href={`/products/${product.slug}`}
                        className="text-sm text-white font-semibold bg-[#4e342e] hover:bg-[#3e2723] py-2 px-4 rounded-full transition duration-300 inline-block"
                      >
                        View Details
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA SECTION */}
      <div className="bg-[#4e342e] text-white py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
            Looking for Something Custom?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            We specialize in bespoke commissions tailored to your specific needs
            and preferences. Contact us to discuss your vision.
          </p>
          <a
            href="/inquire"
            className="inline-block px-8 py-3 bg-white text-[#4e342e] font-semibold rounded-lg hover:bg-[#fcfaf6] transition duration-300"
          >
            Request a Commission
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fcfaf6] flex items-center justify-center">
          <p className="text-[#3e2723] text-lg">Loading products...</p>
        </div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}
