"use client";

import { useState, useRef, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const debounceTimer = useRef(null);

  const executeSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setResults([]);
      setShowModal(false);
      return;
    }

    try {
      setLoading(true);
      setShowModal(true);
      const queryLower = query.toLowerCase();
      const allResults = { products: [], projects: [], blogs: [] };

      try {
        const res = await fetch(`${API_URL}/api/products`);
        if (res.ok) {
          const data = await res.json();
          const arr = Array.isArray(data)
            ? data
            : data.data || data.products || [];
          allResults.products = arr.filter(
            (p) =>
              p.name?.toLowerCase().includes(queryLower) ||
              p.description?.toLowerCase().includes(queryLower) ||
              p.category?.toLowerCase().includes(queryLower),
          );
        }
      } catch {
        /* silent */
      }

      try {
        const res = await fetch(`${API_URL}/api/projects`);
        if (res.ok) {
          const data = await res.json();
          const arr = Array.isArray(data)
            ? data
            : data.data || data.projects || [];
          allResults.projects = arr.filter(
            (p) =>
              p.title?.toLowerCase().includes(queryLower) ||
              p.description?.toLowerCase().includes(queryLower) ||
              p.category?.toLowerCase().includes(queryLower) ||
              p.name?.toLowerCase().includes(queryLower),
          );
        }
      } catch {
        /* silent */
      }

      try {
        const res = await fetch(`${API_URL}/api/blogs`);
        if (res.ok) {
          const data = await res.json();
          const arr = Array.isArray(data)
            ? data
            : data.data || data.blogs || [];
          allResults.blogs = arr.filter(
            (b) =>
              b.title?.toLowerCase().includes(queryLower) ||
              b.content?.toLowerCase().includes(queryLower) ||
              b.category?.toLowerCase().includes(queryLower),
          );
        }
      } catch {
        /* silent */
      }

      setResults(allResults);
    } catch {
      setResults({ products: [], projects: [], blogs: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!query.trim()) {
      setResults([]);
      setShowModal(false);
      return;
    }
    setLoading(true);
    setShowModal(true);
    debounceTimer.current = setTimeout(() => executeSearch(query), 300);
  };

  const getCount = (type) => {
    if (type === "all")
      return (
        (results.products?.length || 0) +
        (results.projects?.length || 0) +
        (results.blogs?.length || 0)
      );
    return results[type]?.length || 0;
  };

  const closeModal = () => {
    setShowModal(false);
    setSearchQuery("");
    setResults([]);
  };

  const renderResults = () => {
    if (activeTab === "all") {
      return (
        <div className="space-y-6">
          {results.products?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-amber-900 mb-3">
                Products
              </h3>
              <div className="space-y-2">
                {results.products.map((item) => (
                  <a
                    key={item.id}
                    href={`/products/${item.slug || item.id}`}
                    className="block p-3 hover:bg-amber-50 rounded-lg transition"
                  >
                    <p className="font-medium text-amber-900">{item.name}</p>
                    <p className="text-sm text-gray-600 truncate">
                      {item.description}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}
          {results.projects?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-amber-900 mb-3">
                Projects
              </h3>
              <div className="space-y-2">
                {results.projects.map((item) => (
                  <a
                    key={item.id}
                    href={`/projects/${item.slug || item.id}`}
                    className="block p-3 hover:bg-amber-50 rounded-lg transition"
                  >
                    <p className="font-medium text-amber-900">{item.title}</p>
                    <p className="text-sm text-gray-600 truncate">
                      {item.description}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}
          {results.blogs?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-amber-900 mb-3">
                Blog Articles
              </h3>
              <div className="space-y-2">
                {results.blogs.map((item) => (
                  <a
                    key={item.id}
                    href={`/blog/${item.slug || item.id}`}
                    className="block p-3 hover:bg-amber-50 rounded-lg transition"
                  >
                    <p className="font-medium text-amber-900">{item.title}</p>
                    <p className="text-sm text-gray-600 truncate">
                      {item.content}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}
          {getCount("all") === 0 && !loading && (
            <p className="text-center text-gray-500">No results found</p>
          )}
        </div>
      );
    }

    const items = results[activeTab] || [];
    return (
      <div className="space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <a
              key={item.id}
              href={
                activeTab === "products"
                  ? `/products/${item.slug || item.id}`
                  : activeTab === "projects"
                    ? `/projects/${item.slug || item.id}`
                    : `/blog/${item.slug || item.id}`
              }
              className="block p-3 hover:bg-amber-50 rounded-lg transition"
            >
              <p className="font-medium text-amber-900">
                {item.name || item.title}
              </p>
              <p className="text-sm text-gray-600 truncate">
                {item.description || item.content}
              </p>
            </a>
          ))
        ) : (
          <p className="text-center text-gray-500">No results found</p>
        )}
      </div>
    );
  };

  const tabs = [
    { key: "all", label: "All" },
    { key: "products", label: "Products" },
    { key: "projects", label: "Projects" },
    { key: "blogs", label: "Blogs" },
  ];

  return (
    <>
      <div className="block">
        <div className="relative">
          <input
            type="text"
            placeholder="Search products, projects, blogs..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="bg-amber-50 border border-amber-200 rounded-full py-2 pl-4 pr-10 text-sm text-black focus:ring-amber-900 focus:border-amber-900 transition duration-300 placeholder-gray-500 w-28 sm:w-40 md:w-56"
          />
          <button className="absolute right-0 top-0 mt-2.5 mr-4 text-gray-500 hover:text-amber-900 transition duration-300">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
          <div className="fixed inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-150 overflow-hidden">
            <div className="sticky top-0 bg-linear-to-r from-amber-50 to-amber-100 border-b border-amber-200 p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-amber-900">
                  Search Results
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-amber-900 transition"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${activeTab === tab.key ? "bg-amber-900 text-white" : "bg-white text-amber-900 border border-amber-200 hover:bg-amber-50"}`}
                  >
                    {tab.label} ({getCount(tab.key)})
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-y-auto max-h-105 p-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-900" />
                </div>
              ) : (
                renderResults()
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SearchBar;
