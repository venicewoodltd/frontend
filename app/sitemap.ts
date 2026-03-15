import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://venicewoodltd.com";
const API_URL = "";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/projects`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/mastery`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/inquire`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms-conditions`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const dynamicPages: MetadataRoute.Sitemap = [];

  try {
    const [productsRes, projectsRes, blogsRes] = await Promise.allSettled([
      fetch(`${API_URL}/api/products?limit=100`),
      fetch(`${API_URL}/api/projects?limit=100`),
      fetch(`${API_URL}/api/blogs?limit=100`),
    ]);

    if (productsRes.status === "fulfilled" && productsRes.value.ok) {
      const data = await productsRes.value.json();
      const products = data.data || data.products || [];
      for (const product of products) {
        if (product.slug) {
          dynamicPages.push({
            url: `${SITE_URL}/products/${product.slug}`,
            lastModified: new Date(product.updatedAt || product.createdAt),
            changeFrequency: "monthly",
            priority: 0.7,
          });
        }
      }
    }

    if (projectsRes.status === "fulfilled" && projectsRes.value.ok) {
      const data = await projectsRes.value.json();
      const projects = data.data || data.projects || [];
      for (const project of projects) {
        if (project.slug) {
          dynamicPages.push({
            url: `${SITE_URL}/projects/${project.slug}`,
            lastModified: new Date(project.updatedAt || project.createdAt),
            changeFrequency: "monthly",
            priority: 0.7,
          });
        }
      }
    }

    if (blogsRes.status === "fulfilled" && blogsRes.value.ok) {
      const data = await blogsRes.value.json();
      const blogs = data.data || data.blogs || [];
      for (const blog of blogs) {
        if (blog.slug) {
          dynamicPages.push({
            url: `${SITE_URL}/blog/${blog.slug}`,
            lastModified: new Date(blog.updatedAt || blog.createdAt),
            changeFrequency: "weekly",
            priority: 0.6,
          });
        }
      }
    }
  } catch {
    // Static pages will still be included
  }

  return [...staticPages, ...dynamicPages];
}
