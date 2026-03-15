"use client";

import { useState, useEffect } from "react";
import { useProducts } from "@/lib/graphql";
import { useToast } from "@/components/ui/Toast";
import CategoryManagementModal from "./CategoryManagementModal";

interface ProductCreator {
  id: string;
  username: string;
  name?: string;
  role?: string;
}

interface Product {
  id: string;
  name: string;
  slug?: string;
  category: string;
  featured: boolean;
  status?: "draft" | "published";
  views?: number;
  createdAt?: string;
  updatedAt?: string;
  createdByUser?: ProductCreator;
}

// Helper function to safely format dates
const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return "-";

    const dateStr = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timeStr = date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dateStr} ${timeStr}`;
  } catch {
    return "-";
  }
};

export default function ProductManagementTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const { getProducts, deleteProduct } = useProducts();
  const { showToast } = useToast();

  // Fetch products on component mount and when filter changes
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        // Pass "all" explicitly for admin to see all products, otherwise pass the specific status
        const statusFilter = filterStatus;
        const result = await getProducts(100, statusFilter);
        if (result && result.products) {
          setProducts(result.products);
        } else if (Array.isArray(result)) {
          setProducts(result as Product[]);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [getProducts, filterStatus]);

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      const result = await deleteProduct(id);

      if (result?.deleteProduct?.success) {
        // Remove from UI
        setProducts(products.filter((p) => p.id !== id));
        showToast({
          type: "success",
          title: "Product Deleted",
          message: `"${name}" has been deleted successfully.`,
        });
      } else {
        showToast({
          type: "error",
          title: "Delete Failed",
          message: result?.deleteProduct?.message || "Unknown error",
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      showToast({
        type: "error",
        title: "Delete Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-[#3e2723]">
          Products Management
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-300 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            Categories
          </button>
          <a
            href="/admin/create-product"
            className="px-4 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition duration-300"
          >
            + New Product
          </a>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-300 ${
            filterStatus === "all"
              ? "bg-[#4e342e] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterStatus("draft")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-300 ${
            filterStatus === "draft"
              ? "bg-[#4e342e] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Draft
        </button>
        <button
          onClick={() => setFilterStatus("published")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-300 ${
            filterStatus === "published"
              ? "bg-[#4e342e] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Published
        </button>
      </div>

      {loadingProducts ? (
        <div className="bg-white rounded-lg p-8 shadow-lg border border-[#d7ccc8] text-center">
          <p className="text-gray-600">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-lg p-8 shadow-lg border border-[#d7ccc8] text-center">
          <p className="text-gray-600 mb-4">
            {filterStatus === "all"
              ? "No products yet"
              : `No ${filterStatus} products`}
          </p>
          <a
            href="/admin/create-product"
            className="inline-block px-4 py-2 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition duration-300"
          >
            Create First Product
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg border border-[#d7ccc8] overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[#d7ccc8]">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Product Name
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Category
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Author
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Featured
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Views
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Modified
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-[#d7ccc8]/50 hover:bg-[#fcfaf6] transition duration-200"
                >
                  <td className="py-3 px-4 text-sm font-medium">
                    {product.name}
                  </td>
                  <td className="py-3 px-4 text-sm">{product.category}</td>
                  <td className="py-3 px-4 text-sm">
                    {product.createdByUser ? (
                      <span className="text-gray-700">
                        {product.createdByUser.name ||
                          product.createdByUser.username}
                        {product.createdByUser.role && (
                          <span className="ml-1 text-xs text-gray-500">
                            ({product.createdByUser.role})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Unknown</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        product.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {product.status === "published" ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        product.featured
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {product.featured ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {product.views || 0}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    <span title={product.updatedAt || product.createdAt || ""}>
                      {formatDate(product.updatedAt || product.createdAt)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <a
                      href={`/products/${product.slug || product.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      View
                    </a>
                    {" | "}
                    <a
                      href={`/admin/edit-product?id=${product.id}`}
                      className="text-[#4e342e] hover:text-[#3e2723] hover:underline"
                    >
                      Edit
                    </a>
                    {" | "}
                    <button
                      onClick={() =>
                        handleDeleteProduct(product.id, product.name)
                      }
                      disabled={deletingId === product.id}
                      className={`${
                        deletingId === product.id
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-red-600 hover:text-red-700 hover:underline"
                      }`}
                    >
                      {deletingId === product.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Category Management Modal */}
      <CategoryManagementModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
      />
    </div>
  );
}
