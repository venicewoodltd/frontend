"use client";

import { useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("adminToken")
          : null;
      const { headers: optHeaders, method, ...restOptions } = options;
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...optHeaders,
      };
      const fullUrl = url.startsWith("http") ? url : `${API_URL}${url}`;
      const response = await fetch(fullUrl, {
        method: method || "GET",
        headers,
        ...restOptions,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.message || `HTTP error! status: ${response.status}`,
        );
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (url) fetchData();
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch: fetchData, setData };
}

export function useLazyFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(
    async (overrideUrl = null) => {
      try {
        setLoading(true);
        setError(null);
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("adminToken")
            : null;
        const { headers: optHeaders, method, ...restOptions } = options;
        const headers = {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          ...optHeaders,
        };
        const fetchUrl = overrideUrl || url;
        const fullUrl = fetchUrl.startsWith("http")
          ? fetchUrl
          : `${API_URL}${fetchUrl}`;
        const response = await fetch(fullUrl, {
          method: method || "GET",
          headers,
          ...restOptions,
        });
        const result = await response.json();
        if (!response.ok)
          throw new Error(
            result.message || `HTTP error! status: ${response.status}`,
          );
        setData(result);
        return result;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [url],
  );

  return { data, loading, error, fetch: fetchData, setData };
}

export default useFetch;
