"use client";

import { useState, useCallback } from "react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "") + "/graphql";

export function useGraphQL() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const query = useCallback(async (queryString, variables = null) => {
    setLoading(true);
    setError(null);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("adminToken")
          : null;
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const body = { query: queryString };
      if (variables) body.variables = variables;

      const response = await fetch(API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.errors) {
        throw new Error(data.errors[0].message);
      }
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { query, loading, error };
}

export function useProducts() {
  const { query } = useGraphQL();

  const getProducts = useCallback(
    async (limit = 10, status = "published") => {
      const queryString = `
      query GetProducts($limit: Int, $status: String) {
        products(limit: $limit, status: $status) {
          id name slug description category image featured status views
          createdAt updatedAt
          createdByUser { id username name role }
        }
      }
    `;
      return query(queryString, { limit, status });
    },
    [query],
  );

  const createProduct = useCallback(
    async (input) => {
      const queryString = `
      mutation CreateProduct($input: ProductInput!) {
        createProduct(input: $input) {
          id name slug description category image featured createdAt
        }
      }
    `;
      return query(queryString, { input });
    },
    [query],
  );

  const getProduct = useCallback(
    async (id) => {
      const queryString = `
      query GetProduct($id: ID!) {
        productById(id: $id) {
          id name slug description longDescription category image galleryImages
          featured status seoTags wood_type material
          specifications { key value }
          whatsappText emailText
          createdAt
        }
      }
    `;
      const result = await query(queryString, { id });
      return result?.productById;
    },
    [query],
  );

  const updateProduct = useCallback(
    async (id, input) => {
      const queryString = `
      mutation UpdateProduct($id: ID!, $input: ProductInput!) {
        updateProduct(id: $id, input: $input) {
          id name slug description category image featured createdAt
        }
      }
    `;
      return query(queryString, { id, input });
    },
    [query],
  );

  const deleteProduct = useCallback(
    async (id) => {
      const queryString = `
      mutation DeleteProduct($id: ID!) {
        deleteProduct(id: $id) { success message }
      }
    `;
      return query(queryString, { id });
    },
    [query],
  );

  const getProductBySlug = useCallback(
    async (slug) => {
      const queryString = `
      query GetProductBySlug($slug: String!) {
        productBySlug(slug: $slug) {
          id name slug description longDescription category image galleryImages
          featured status wood_type material
          specifications { key value }
          whatsappText emailText
          createdAt
        }
      }
    `;
      return query(queryString, { slug });
    },
    [query],
  );

  const getFeaturedProducts = useCallback(
    async (limit = 3) => {
      const queryString = `
      query GetFeaturedProducts($limit: Int) {
        featuredProducts(limit: $limit) {
          id name slug description category image featured createdAt
        }
      }
    `;
      return query(queryString, { limit });
    },
    [query],
  );

  return {
    getProducts,
    createProduct,
    getProduct,
    updateProduct,
    deleteProduct,
    getProductBySlug,
    getFeaturedProducts,
  };
}
