"use client";

import { useEffect, useState, ReactNode, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { ToastProvider } from "@/components/ui/Toast";

interface AdminUser {
  id: string;
  name: string;
  username: string;
  role: "admin" | "editor";
  permissions: string[] | null;
  photoFileId: string | null;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { getToken, getUser, logout } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Start with false for login page, true for others
  const isLoginPage = pathname === "/admin/login";
  const [isLoading, setIsLoading] = useState(!isLoginPage);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const healthCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const forceLogout = useCallback(() => {
    logout();
    setIsAuthenticated(false);
    router.push("/admin/login");
  }, [logout, router]);

  useEffect(() => {
    // Don't check auth on login page
    if (isLoginPage) {
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

    // Check if user is authenticated by validating token with backend
    const checkAuth = async () => {
      const token = getToken();
      if (!token) {
        await router.push("/admin/login");
        setIsLoading(false);
        return;
      }

      // Session check: if sessionStorage flag is missing, this is a new tab/browser session
      const sessionActive = sessionStorage.getItem("adminSessionActive");
      if (!sessionActive) {
        logout();
        await router.push("/admin/login");
        setIsLoading(false);
        return;
      }

      try {
        // Validate token against backend with a timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${API_URL}/api/admin/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
          // Token is invalid or expired — clear and redirect
          logout();
          await router.push("/admin/login");
          setIsLoading(false);
          return;
        }
        setIsAuthenticated(true);
        try {
          const userData = getUser();
          setUser(userData);
        } catch {
          // If we can't parse user data but token is valid, still authenticated
        }
      } catch {
        // Network error or timeout — backend is unreachable, force logout
        logout();
        await router.push("/admin/login");
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [isLoginPage, router, getToken, getUser, logout]);

  // Periodic health check — verify backend is reachable every 30 seconds
  useEffect(() => {
    if (isLoginPage || !isAuthenticated) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

    const healthCheck = async () => {
      const token = getToken();
      if (!token) {
        forceLogout();
        return;
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${API_URL}/api/admin/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) forceLogout();
      } catch {
        // Backend unreachable — force logout
        forceLogout();
      }
    };

    healthCheckRef.current = setInterval(healthCheck, 30000);
    return () => {
      if (healthCheckRef.current) clearInterval(healthCheckRef.current);
    };
  }, [isLoginPage, isAuthenticated, getToken, forceLogout]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  // For login page, just render children without protection
  if (isLoginPage) {
    return children;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfaf6]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#4e342e]"></div>
          <p className="mt-4 text-[#3e2723]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-[#fcfaf6]">
      {/* Top Navigation Bar */}
      <nav className="bg-[#4e342e] text-white shadow-lg fixed top-0 left-0 right-0 z-50">
        <div className="px-4 py-3 flex justify-between items-center">
          {/* Left - Brand */}
          <h1 className="text-xl font-serif font-bold">Venice Wood Admin</h1>

          {/* Right - Welcome + Profile Menu */}
          <div className="flex items-center gap-4">
            {/* Welcome Message */}
            <span className="text-sm hidden sm:inline">
              Welcome,{" "}
              <span className="font-semibold">{user?.name || "User"}</span>
            </span>

            {/* Profile Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 hover:bg-[#3e2723] rounded-lg px-2 py-1 transition"
              >
                {/* User Profile Picture or VW Logo */}
                {user?.photoFileId ? (
                  <Image
                    src={`${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/images/${user.photoFileId}`}
                    alt={user.name}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-bold text-[#4e342e] shrink-0">
                    VW
                  </div>
                )}

                {/* Hamburger Icon */}
                <svg
                  className={`w-5 h-5 transition-transform duration-200 ${
                    menuOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 text-gray-800">
                  {user && (
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-semibold text-[#4e342e]">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {user.role}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      if (user) {
                        router.push(`/admin/users/edit/${user.id}`);
                      }
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#fcfaf6] text-[#3e2723] flex items-center gap-2 transition"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit Account
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 transition"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - with top padding for fixed nav */}
      <main className="pt-14">
        <ToastProvider>{children}</ToastProvider>
      </main>
    </div>
  );
}
