"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
);

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

import ProductManagementTab from "./components/ProductManagementTab";
import UsersManagementTab from "./components/UsersManagementTab";
import ProjectsManagementTab from "./components/ProjectsManagementTab";
import BlogsManagementTab from "./components/BlogsManagementTab";
import InquiriesManagementTab from "./components/InquiriesManagementTab";
import TestimonialsManagementTab from "./components/TestimonialsManagementTab";
import GalleryManagementTab from "./components/GalleryManagementTab";
import SettingsManagementTab from "./components/SettingsManagementTab";

interface MostViewedItem {
  name: string;
  slug: string;
  views: number;
  type: "product" | "project" | "blog";
}

interface DashboardStats {
  totalProducts: number;
  totalProjects: number;
  totalBlogs: number;
  totalInquiries: number;
  newInquiries: number;
  totalTestimonials: number;
  avgRating: number;
}

interface Activity {
  id: string;
  type: string;
  icon: string;
  title: string;
  subtitle: string;
  entityId: string;
  timestamp: string;
  relativeTime: string;
  color: string;
}

interface AdminUser {
  id: string;
  name: string;
  username: string;
  role: "admin" | "editor";
  permissions: string[] | null;
  photoFileId: string | null;
}

// SVG icon paths (Heroicons outline)
const ICON_PATHS: Record<string, string[]> = {
  dashboard: [
    "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  ],
  products: ["M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"],
  projects: [
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
  ],
  blogs: [
    "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  ],
  inquiries: [
    "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  ],
  testimonials: [
    "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  ],
  gallery: [
    "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  ],
  users: [
    "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  ],
  settings: [
    "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  ],
};

function NavSvgIcon({
  name,
  className = "w-5 h-5",
}: {
  name: string;
  className?: string;
}) {
  const paths = ICON_PATHS[name] || ICON_PATHS.dashboard;
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      {paths.map((d, i) => (
        <path key={i} strokeLinecap="round" strokeLinejoin="round" d={d} />
      ))}
    </svg>
  );
}

// All available quick actions for dashboard
const ALL_QUICK_ACTIONS = [
  {
    id: "products",
    label: "Manage Products",
    tab: "products",
    permission: "products",
    adminOnly: false,
    href: "",
  },
  {
    id: "inquiries",
    label: "Review Inquiries",
    tab: "inquiries",
    permission: "inquiries",
    adminOnly: false,
    href: "",
  },
  {
    id: "blogs",
    label: "Write Blog Post",
    tab: "blogs",
    permission: "blogs",
    adminOnly: false,
    href: "",
  },
  {
    id: "projects",
    label: "View Projects",
    tab: "projects",
    permission: "projects",
    adminOnly: false,
    href: "",
  },
  {
    id: "testimonials",
    label: "Manage Testimonials",
    tab: "testimonials",
    permission: "testimonials",
    adminOnly: false,
    href: "",
  },
  {
    id: "gallery",
    label: "Manage Gallery",
    tab: "gallery",
    permission: "",
    adminOnly: true,
    href: "",
  },
  {
    id: "users",
    label: "Manage Users",
    tab: "users",
    permission: "",
    adminOnly: false,
    href: "",
  },
  {
    id: "settings",
    label: "View Settings",
    tab: "settings",
    permission: "",
    adminOnly: true,
    href: "",
  },
  {
    id: "create-product",
    label: "Create Product",
    tab: "products",
    permission: "products",
    adminOnly: false,
    href: "/admin/create-product",
  },
  {
    id: "create-project",
    label: "Create Project",
    tab: "projects",
    permission: "projects",
    adminOnly: false,
    href: "/admin/create-project",
  },
  {
    id: "create-blog",
    label: "Create Blog",
    tab: "blogs",
    permission: "blogs",
    adminOnly: false,
    href: "/admin/create-blog",
  },
];

// Navigation items
const ALL_NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    adminOnly: false,
    permission: null as string | null,
  },
  {
    id: "products",
    label: "Products",
    adminOnly: false,
    permission: "products" as string | null,
  },
  {
    id: "projects",
    label: "Projects",
    adminOnly: false,
    permission: "projects" as string | null,
  },
  {
    id: "blogs",
    label: "Blog Articles",
    adminOnly: false,
    permission: "blogs" as string | null,
  },
  {
    id: "inquiries",
    label: "Inquiries",
    adminOnly: false,
    permission: "inquiries" as string | null,
  },
  {
    id: "testimonials",
    label: "Testimonials",
    adminOnly: false,
    permission: "testimonials" as string | null,
  },
  {
    id: "gallery",
    label: "Gallery",
    adminOnly: true,
    permission: null as string | null,
  },
  {
    id: "users",
    label: "Users",
    adminOnly: false,
    permission: null as string | null,
  },
  {
    id: "settings",
    label: "Settings",
    adminOnly: true,
    permission: null as string | null,
  },
];

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getUser, logout } = useAuth();

  // Read ?tab= from URL, default to "dashboard"
  const initialTab = searchParams.get("tab") || "dashboard";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalProjects: 0,
    totalBlogs: 0,
    totalInquiries: 0,
    newInquiries: 0,
    totalTestimonials: 0,
    avgRating: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [mostViewed, setMostViewed] = useState<MostViewedItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [loadingMostViewed, setLoadingMostViewed] = useState(true);
  const [visitData, setVisitData] = useState<
    Array<{ date: string; visits: number }>
  >([]);
  const [loadingVisits, setLoadingVisits] = useState(true);
  const [visitPeriod, setVisitPeriod] = useState<string>("30days");
  const [quickActions, setQuickActions] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("dashboardQuickActions");
      if (stored)
        try {
          return JSON.parse(stored);
        } catch {
          /* ignore */
        }
    }
    return ["products", "inquiries", "blogs", "projects", "testimonials"];
  });
  const [showQuickActionSettings, setShowQuickActionSettings] = useState(false);
  const visitChartRef = useRef<HTMLCanvasElement>(null);
  const visitChartInstance = useRef<Chart | null>(null);

  // Filter nav items based on user role and permissions
  const navItems = useMemo(() => {
    if (!user) return [];

    // Admin sees everything
    if (user.role === "admin") {
      return ALL_NAV_ITEMS;
    }

    // Editor sees dashboard + their permitted sections
    return ALL_NAV_ITEMS.filter((item) => {
      // Dashboard is always visible
      if (item.id === "dashboard") return true;
      // Admin-only items are hidden for editors
      if (item.adminOnly) return false;
      // If no permission requirement (like Profile), show it
      if (!item.permission) return true;
      // Check if editor has permission for this item
      if (user.permissions && user.permissions.includes(item.permission)) {
        return true;
      }
      return false;
    });
  }, [user]);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin/login");
    } else {
      setIsAuthenticated(true);
      const userData = getUser();
      setUser(userData);
    }
  }, [router, getUser]);

  // Sync tab state with URL query param
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Update URL when tab changes (so refresh preserves the tab)
  useEffect(() => {
    const currentTab = searchParams.get("tab") || "dashboard";
    if (activeTab !== currentTab) {
      const params = new URLSearchParams(searchParams.toString());
      if (activeTab === "dashboard") {
        params.delete("tab");
      } else {
        params.set("tab", activeTab);
      }
      const query = params.toString();
      router.replace(`/admin${query ? `?${query}` : ""}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const token = localStorage.getItem("adminToken");

        // Build array of fetch promises based on user permissions
        const fetchPromises: Promise<Response>[] = [];
        const fetchKeys: string[] = [];

        // Only fetch products if user has permission or is admin
        if (user?.role === "admin" || user?.permissions?.includes("products")) {
          fetchPromises.push(
            fetch(`${API_URL}/api/admin/products?limit=1000`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          );
          fetchKeys.push("products");
        }

        // Only fetch if user has permission or is admin
        if (user?.role === "admin" || user?.permissions?.includes("blogs")) {
          fetchPromises.push(
            fetch(`${API_URL}/api/admin/blogs`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          );
          fetchKeys.push("blogs");
        }

        if (user?.role === "admin" || user?.permissions?.includes("projects")) {
          fetchPromises.push(
            fetch(`${API_URL}/api/admin/projects`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          );
          fetchKeys.push("projects");
        }

        // Fetch inquiries if user has permission or is admin
        if (
          user?.role === "admin" ||
          user?.permissions?.includes("inquiries")
        ) {
          fetchPromises.push(
            fetch(`${API_URL}/api/admin/inquiries`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          );
          fetchKeys.push("inquiries");
        }

        // Fetch testimonials if user has permission or is admin
        if (
          user?.role === "admin" ||
          user?.permissions?.includes("testimonials")
        ) {
          fetchPromises.push(
            fetch(`${API_URL}/api/admin/testimonials`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          );
          fetchKeys.push("testimonials");
        }

        const responses = await Promise.all(fetchPromises);
        const dataMap: Record<string, Record<string, unknown>> = {};

        for (let i = 0; i < responses.length; i++) {
          const data = await responses[i].json();
          dataMap[fetchKeys[i]] = data;
        }

        const productsArray =
          (dataMap.products?.data as unknown[]) ||
          (dataMap.products?.products as unknown[]) ||
          [];
        const blogs =
          (dataMap.blogs?.data as unknown[]) ||
          (dataMap.blogs?.blogs as unknown[]) ||
          [];
        const projects =
          (dataMap.projects?.data as unknown[]) ||
          (dataMap.projects?.projects as unknown[]) ||
          [];
        const inquiries = (dataMap.inquiries?.data as unknown[]) || [];
        const testimonials = (dataMap.testimonials?.data as unknown[]) || [];

        const avgRating =
          testimonials.length > 0
            ? (
                (testimonials as Array<{ rating?: number }>).reduce(
                  (sum: number, t: { rating?: number }) =>
                    sum + (t.rating || 0),
                  0,
                ) / testimonials.length
              ).toFixed(1)
            : 0;

        setStats({
          totalProducts: productsArray.length,
          totalProjects: projects.length,
          totalBlogs: blogs.length,
          totalInquiries: inquiries.length,
          newInquiries: (inquiries as Array<{ status?: string }>).filter(
            (i: { status?: string }) => i.status === "new",
          ).length,
          totalTestimonials: testimonials.length,
          avgRating: parseFloat(avgRating as string),
        });

        // Build most-viewed list from fetched data
        type ViewableItem = {
          name?: string;
          title?: string;
          slug?: string;
          views?: number;
        };
        const viewedItems: MostViewedItem[] = [];
        (productsArray as ViewableItem[]).forEach((p) => {
          viewedItems.push({
            name: p.name || "Untitled",
            slug: p.slug || "",
            views: p.views || 0,
            type: "product",
          });
        });
        (projects as ViewableItem[]).forEach((p) => {
          viewedItems.push({
            name: p.name || p.title || "Untitled",
            slug: p.slug || "",
            views: p.views || 0,
            type: "project",
          });
        });
        (blogs as ViewableItem[]).forEach((b) => {
          viewedItems.push({
            name: b.title || "Untitled",
            slug: b.slug || "",
            views: b.views || 0,
            type: "blog",
          });
        });
        viewedItems.sort((a, b) => b.views - a.views);
        setMostViewed(viewedItems.slice(0, 8));
        setLoadingMostViewed(false);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    // Fetch recent activity
    const fetchActivity = async () => {
      try {
        setLoadingActivity(true);
        const token = localStorage.getItem("adminToken");

        const response = await fetch(
          `${API_URL}/api/admin/activity/recent?limit=5`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setRecentActivity(data.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch activity:", error);
      } finally {
        setLoadingActivity(false);
      }
    };

    // Fetch website visit analytics
    const fetchVisits = async () => {
      try {
        setLoadingVisits(true);
        const token = localStorage.getItem("adminToken");

        const response = await fetch(
          `${API_URL}/api/admin/analytics/visits?period=${visitPeriod}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setVisitData(data.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch visit analytics:", error);
      } finally {
        setLoadingVisits(false);
      }
    };

    if (isAuthenticated && activeTab === "dashboard" && user) {
      fetchStats();
      fetchVisits();
      if (user.role === "admin") {
        fetchActivity();
      }
    }
  }, [isAuthenticated, activeTab, user, visitPeriod]);

  // Build / update the Chart.js line chart whenever visitData changes
  const buildVisitChart = useCallback(() => {
    if (!visitChartRef.current || visitData.length === 0) return;
    if (visitChartInstance.current) {
      visitChartInstance.current.destroy();
      visitChartInstance.current = null;
    }
    const labels = visitData.map((d) => {
      const parts = d.date.split("-");
      return parts.length >= 2
        ? `${parts[parts.length - 2]}/${parts[parts.length - 1]}`
        : d.date;
    });
    const values = visitData.map((d) => d.visits);
    visitChartInstance.current = new Chart(visitChartRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            data: values,
            borderColor: "#4e342e",
            backgroundColor: "rgba(78,52,46,0.08)",
            borderWidth: 2,
            pointBackgroundColor: "#4e342e",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            fill: true,
            tension: 0.35,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            backgroundColor: "#3e2723",
            titleFont: { size: 11 },
            bodyFont: { size: 11 },
            padding: 8,
            displayColors: false,
            callbacks: {
              label: (ctx) => `${ctx.parsed.y} visits`,
            },
          },
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 10 },
              color: "#9e9e9e",
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 7,
            },
            border: { display: false },
          },
          y: {
            beginAtZero: true,
            grid: { color: "rgba(0,0,0,0.04)" },
            ticks: { font: { size: 10 }, color: "#9e9e9e", precision: 0 },
            border: { display: false },
          },
        },
        interaction: { intersect: false, mode: "index" as const },
      },
    });
  }, [visitData]);

  useEffect(() => {
    buildVisitChart();
    return () => {
      if (visitChartInstance.current) {
        visitChartInstance.current.destroy();
        visitChartInstance.current = null;
      }
    };
  }, [buildVisitChart]);

  // Show loading while checking auth
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fcfaf6] flex items-center justify-center">
        <div className="text-[#4e342e] text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#fcfaf6] text-[#3e2723] font-sans overflow-hidden">
      {/* SIDEBAR + MAIN CONTENT LAYOUT */}
      <div className="flex h-[calc(100vh-56px)] overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-64 shrink-0 bg-white shadow-lg border-r border-[#d7ccc8] overflow-y-auto overscroll-contain">
          <div className="p-6 border-b border-[#d7ccc8]">
            <h1 className="text-2xl font-serif font-bold text-[#4e342e]">
              {user?.role === "admin" ? "ADMIN" : "EDITOR"}
            </h1>
            <p className="text-xs text-gray-500 mt-1">VeniceWoodLtd</p>
          </div>

          <nav className="mt-6 flex flex-col h-[calc(100%-100px)]">
            <div className="flex-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-6 py-3 text-[#3e2723] hover:bg-[#4e342e]/5 transition duration-300 ${
                    activeTab === item.id
                      ? "bg-[#4e342e]/10 border-l-4 border-[#4e342e]"
                      : ""
                  }`}
                >
                  <NavSvgIcon name={item.id} className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Logout Button */}
            <div className="border-t border-[#d7ccc8] p-4">
              <button
                onClick={() => {
                  logout();
                  router.push("/admin/login");
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition duration-300"
              >
                <svg
                  className="w-5 h-5"
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
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </nav>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* TOP BAR */}
          <div className="bg-white shadow-md border-b border-[#d7ccc8] py-4 px-6 flex justify-between items-center">
            <h2 className="text-2xl font-serif font-bold text-[#4e342e]">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user?.role === "admin"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {user?.role?.toUpperCase()}
              </span>
            </div>
          </div>

          {/* CONTENT AREA */}
          <div className="flex-1 overflow-auto overscroll-contain">
            {/* DASHBOARD TAB */}
            {activeTab === "dashboard" && (
              <div className="p-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-lg p-6 shadow-lg border border-[#d7ccc8] hover:shadow-xl transition duration-300">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-gray-600 text-sm font-medium">
                          Total Products
                        </p>
                        <p className="text-3xl font-bold text-[#4e342e] mt-2">
                          {loadingStats ? "..." : stats.totalProducts}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">In catalog</p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
                        <NavSvgIcon name="products" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-lg border border-[#d7ccc8] hover:shadow-xl transition duration-300">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-gray-600 text-sm font-medium">
                          Projects Completed
                        </p>
                        <p className="text-3xl font-bold text-[#4e342e] mt-2">
                          {loadingStats ? "..." : stats.totalProjects}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Showcase projects
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
                        <NavSvgIcon name="projects" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-lg border border-[#d7ccc8] hover:shadow-xl transition duration-300">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-gray-600 text-sm font-medium">
                          Blog Articles
                        </p>
                        <p className="text-3xl font-bold text-[#4e342e] mt-2">
                          {loadingStats ? "..." : stats.totalBlogs}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Published posts
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-700">
                        <NavSvgIcon name="blogs" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-lg border border-[#d7ccc8] hover:shadow-xl transition duration-300">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-gray-600 text-sm font-medium">
                          New Inquiries
                        </p>
                        <p className="text-3xl font-bold text-red-600 mt-2">
                          {loadingStats ? "..." : stats.newInquiries}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          of {loadingStats ? "..." : stats.totalInquiries} total
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-700">
                        <NavSvgIcon name="inquiries" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Second Row of Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white rounded-lg p-4 shadow-lg border border-[#d7ccc8]">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-semibold text-[#3e2723] uppercase tracking-wide">
                        Quick Actions
                      </h3>
                      <button
                        onClick={() =>
                          setShowQuickActionSettings(!showQuickActionSettings)
                        }
                        className="p-1 rounded hover:bg-gray-100 transition"
                        title="Configure quick actions"
                      >
                        <NavSvgIcon
                          name="settings"
                          className="w-3.5 h-3.5 text-gray-400"
                        />
                      </button>
                    </div>
                    {showQuickActionSettings ? (
                      <div className="space-y-0.5 max-h-64 overflow-y-auto">
                        <p className="text-[10px] text-gray-400 mb-1.5">
                          Toggle which actions appear:
                        </p>
                        {ALL_QUICK_ACTIONS.filter((action) => {
                          if (action.adminOnly && user?.role !== "admin")
                            return false;
                          if (
                            action.permission &&
                            user?.role !== "admin" &&
                            !user?.permissions?.includes(action.permission)
                          )
                            return false;
                          return true;
                        }).map((action) => (
                          <label
                            key={action.id}
                            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={quickActions.includes(action.id)}
                              onChange={() => {
                                const updated = quickActions.includes(action.id)
                                  ? quickActions.filter((a) => a !== action.id)
                                  : [...quickActions, action.id];
                                setQuickActions(updated);
                                localStorage.setItem(
                                  "dashboardQuickActions",
                                  JSON.stringify(updated),
                                );
                              }}
                              className="rounded border-gray-300 text-[#4e342e] focus:ring-[#4e342e] w-3 h-3"
                            />
                            <span className="text-[#3e2723]">
                              {action.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        {ALL_QUICK_ACTIONS.filter((action) => {
                          if (!quickActions.includes(action.id)) return false;
                          if (action.adminOnly && user?.role !== "admin")
                            return false;
                          if (
                            action.permission &&
                            user?.role !== "admin" &&
                            !user?.permissions?.includes(action.permission)
                          )
                            return false;
                          return true;
                        }).map((action) => (
                          <button
                            key={action.id}
                            onClick={() =>
                              action.href
                                ? router.push(action.href)
                                : setActiveTab(action.tab)
                            }
                            className="text-left px-2.5 py-2 rounded bg-[#fcfaf6] text-[#4e342e] hover:bg-[#4e342e] hover:text-white transition duration-200 text-xs font-medium truncate"
                          >
                            {action.label}
                          </button>
                        ))}
                        {quickActions.length === 0 && (
                          <p className="col-span-2 text-xs text-gray-400 text-center py-2">
                            Click the gear icon to add actions
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-lg border border-[#d7ccc8]">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-semibold text-[#3e2723] uppercase tracking-wide">
                        Website Visits
                      </h3>
                      <select
                        value={visitPeriod}
                        onChange={(e) => setVisitPeriod(e.target.value)}
                        className="text-[10px] px-2 py-0.5 border border-[#d7ccc8] rounded bg-white text-[#3e2723] focus:outline-none focus:border-[#4e342e]"
                      >
                        <option value="7days">7 Days</option>
                        <option value="30days">30 Days</option>
                        <option value="3months">3 Months</option>
                        <option value="6months">6 Months</option>
                        <option value="year">This Year</option>
                      </select>
                    </div>
                    {loadingVisits ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#4e342e]"></div>
                      </div>
                    ) : visitData.length > 0 ? (
                      <div>
                        <div style={{ height: "180px" }}>
                          <canvas ref={visitChartRef} />
                        </div>
                        {/* Stats */}
                        <div className="flex gap-4 mt-3 pt-3 border-t border-[#d7ccc8]">
                          <div>
                            <div className="text-lg font-bold text-[#4e342e]">
                              {visitData
                                .reduce((sum, d) => sum + d.visits, 0)
                                .toLocaleString()}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              Total Visits
                            </div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-[#4e342e]">
                              {Math.round(
                                visitData.reduce(
                                  (sum, d) => sum + d.visits,
                                  0,
                                ) / visitData.length,
                              ).toLocaleString()}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              Avg per Period
                            </div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-[#4e342e]">
                              {Math.max(
                                ...visitData.map((d) => d.visits),
                              ).toLocaleString()}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              Peak
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <NavSvgIcon
                          name="dashboard"
                          className="w-8 h-8 mx-auto mb-2"
                        />
                        <p className="text-xs">No visit data yet</p>
                        <p className="text-[10px] mt-1">
                          Visits will be tracked automatically
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-6 shadow-lg border border-[#d7ccc8]">
                    <h3 className="text-lg font-semibold text-[#3e2723] mb-4">
                      Most Viewed
                    </h3>
                    <div className="space-y-3">
                      {loadingMostViewed ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#4e342e]"></div>
                        </div>
                      ) : mostViewed.length > 0 ? (
                        mostViewed.map((item, i) => {
                          const typeIconName =
                            item.type === "product"
                              ? "products"
                              : item.type === "project"
                                ? "projects"
                                : "blogs";
                          const typeColor =
                            item.type === "product"
                              ? "bg-amber-100 text-amber-700"
                              : item.type === "project"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700";
                          return (
                            <div
                              key={`${item.type}-${i}`}
                              className="flex items-center gap-3 pb-3 border-b border-[#d7ccc8]/30 last:border-b-0"
                            >
                              <span className="text-sm shrink-0 w-5 text-center">
                                {i + 1}.
                              </span>
                              <NavSvgIcon
                                name={typeIconName}
                                className="w-4 h-4 shrink-0 text-[#4e342e]"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-[#3e2723] text-sm truncate">
                                  {item.name}
                                </p>
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${typeColor}`}
                                >
                                  {item.type}
                                </span>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-bold text-[#4e342e]">
                                  {item.views}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  views
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-sm">No view data yet</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-lg border border-[#d7ccc8]">
                    <h3 className="text-lg font-semibold text-[#3e2723] mb-4">
                      Recent Activity
                    </h3>
                    <div className="space-y-3">
                      {loadingActivity ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#4e342e]"></div>
                        </div>
                      ) : recentActivity.length > 0 ? (
                        recentActivity.map((activity) => (
                          <div
                            key={activity.id}
                            className="flex items-start gap-3 pb-3 border-b border-[#d7ccc8]/30 last:border-b-0"
                          >
                            <div
                              className={`w-8 h-8 rounded-full ${activity.color} flex items-center justify-center shrink-0`}
                            >
                              <NavSvgIcon
                                name={activity.icon || "settings"}
                                className="w-4 h-4"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-[#3e2723] text-sm">
                                {activity.title}
                              </p>
                              <p className="text-xs text-gray-600 truncate">
                                {activity.subtitle}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {activity.relativeTime}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-sm">No recent activity</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PRODUCTS TAB */}
            {activeTab === "products" && <ProductManagementTab />}

            {/* OTHER TABS PLACEHOLDER */}
            {activeTab === "projects" && <ProjectsManagementTab />}

            {activeTab === "blogs" && <BlogsManagementTab />}

            {activeTab === "inquiries" && <InquiriesManagementTab />}

            {activeTab === "testimonials" && <TestimonialsManagementTab />}

            {activeTab === "gallery" && <GalleryManagementTab />}

            {activeTab === "users" && <UsersManagementTab />}

            {activeTab === "settings" && <SettingsManagementTab />}

            {![
              "dashboard",
              "products",
              "users",
              "projects",
              "blogs",
              "inquiries",
              "testimonials",
              "gallery",
              "settings",
            ].includes(activeTab) && (
              <div className="p-6">
                <div className="bg-white rounded-lg p-8 shadow-lg border border-[#d7ccc8] text-center">
                  <h3 className="text-xl font-semibold text-[#3e2723] mb-2">
                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                  </h3>
                  <p className="text-gray-600">
                    Content for {activeTab} management will appear here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
