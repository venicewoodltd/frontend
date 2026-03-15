"use client";

import { useCallback } from "react";

const getAuthApiUrl = () => {
  let baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  baseUrl = baseUrl.replace(/\/$/, "").replace(/\/graphql$/, "");
  return `${baseUrl}/api/admin/auth`;
};

export function useAuth() {
  const login = useCallback(async (username, password) => {
    const authUrl = getAuthApiUrl();
    const loginUrl = `${authUrl}/login`;

    try {
      const response = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const error = JSON.parse(errorText);
          throw new Error(
            error.error || error.message || "Invalid username or password.",
          );
        } catch (parseError) {
          if (parseError.message && parseError.message !== "Login failed")
            throw parseError;
          if (response.status === 401)
            throw new Error("Invalid username or password.");
          if (response.status === 423)
            throw new Error("Account locked. Please try again later.");
          if (response.status === 429)
            throw new Error("Too many login attempts. Please try again later.");
          throw new Error("Unable to connect to server. Please try again.");
        }
      }

      const data = await response.json();

      if (data.token) {
        localStorage.setItem("adminToken", data.token);
        sessionStorage.setItem("adminSessionActive", "true");
        if (data.refreshToken) {
          localStorage.setItem("adminRefreshToken", data.refreshToken);
        }
        if (data.admin) {
          localStorage.setItem("adminUser", JSON.stringify(data.admin));
        }
      }
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error("Cannot connect to server. Is the backend running?");
      }
      throw error;
    }
  }, []);

  const refreshAccessToken = useCallback(async () => {
    const refreshToken = localStorage.getItem("adminRefreshToken");
    if (!refreshToken) return null;

    try {
      const authUrl = getAuthApiUrl();
      const response = await fetch(`${authUrl}/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        // Refresh failed — clear all tokens
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminRefreshToken");
        localStorage.removeItem("adminUser");
        sessionStorage.removeItem("adminSessionActive");
        return null;
      }

      const data = await response.json();
      if (data.token) {
        localStorage.setItem("adminToken", data.token);
        if (data.refreshToken) {
          localStorage.setItem("adminRefreshToken", data.refreshToken);
        }
        return data.token;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const logout = useCallback(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
      fetch(`${API_URL}/api/admin/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRefreshToken");
    localStorage.removeItem("adminUser");
    sessionStorage.removeItem("adminSessionActive");
  }, []);

  const getToken = useCallback(() => {
    if (typeof window !== "undefined")
      return localStorage.getItem("adminToken");
    return null;
  }, []);

  const getUser = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        const user = localStorage.getItem("adminUser");
        if (!user) return null;
        return JSON.parse(user);
      } catch {
        localStorage.removeItem("adminUser");
        return null;
      }
    }
    return null;
  }, []);

  const isAuthenticated = useCallback(() => {
    return !!getToken();
  }, [getToken]);

  return {
    login,
    logout,
    getToken,
    getUser,
    isAuthenticated,
    refreshAccessToken,
  };
}
