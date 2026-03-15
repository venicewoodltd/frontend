"use client";

import { useState, useCallback } from "react";

const API_URL = "";

async function tryRefreshToken() {
  const refreshToken = localStorage.getItem("adminRefreshToken");
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_URL}/api/admin/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("adminToken", data.token);
      if (data.refreshToken)
        localStorage.setItem("adminRefreshToken", data.refreshToken);
      return data.token;
    }
    return null;
  } catch {
    return null;
  }
}

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (method, endpoint, body, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("adminToken")
          : null;
      const { headers: optHeaders, ...restOptions } = options;
      const headers = {
        ...(body &&
          !(body instanceof FormData) && {
            "Content-Type": "application/json",
          }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...optHeaders,
      };
      const config = { method, headers, ...restOptions };
      if (body) config.body = JSON.stringify(body);

      let response = await fetch(`${API_URL}${endpoint}`, config);

      // Auto-refresh on 401
      if (response.status === 401 && token) {
        const newToken = await tryRefreshToken();
        if (newToken) {
          config.headers.Authorization = `Bearer ${newToken}`;
          response = await fetch(`${API_URL}${endpoint}`, config);
        }
      }

      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error ||
            data.message ||
            `HTTP error! status: ${response.status}`,
        );
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback(
    (endpoint, opts) => request("GET", endpoint, null, opts),
    [request],
  );
  const post = useCallback(
    (endpoint, body, opts) => request("POST", endpoint, body, opts),
    [request],
  );
  const put = useCallback(
    (endpoint, body, opts) => request("PUT", endpoint, body, opts),
    [request],
  );
  const del = useCallback(
    (endpoint, opts) => request("DELETE", endpoint, null, opts),
    [request],
  );

  return { get, post, put, del, loading, error, setError };
}

export default useApi;
