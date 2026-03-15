"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { sanitizeHTML } from "@/lib/sanitize";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

interface MasteryContent {
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  history: string;
  yearsExperience: number;
  projectsCompleted: number;
  satisfiedClients: number;
}

interface MasteryPillar {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
}

// Icon mapping for different pillar types
const ICON_MAP: { [key: string]: React.ReactNode } = {
  leaf: (
    <svg
      className="w-12 h-12 mx-auto mb-4 text-[#4e342e]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      ></path>
    </svg>
  ),
  cog: (
    <svg
      className="w-12 h-12 mx-auto mb-4 text-[#4e342e]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z"
      ></path>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      ></path>
    </svg>
  ),
  hand: (
    <svg
      className="w-12 h-12 mx-auto mb-4 text-[#4e342e]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
      ></path>
    </svg>
  ),
  hammer: (
    <svg
      className="w-12 h-12 mx-auto mb-4 text-[#4e342e]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
      ></path>
    </svg>
  ),
  tree: (
    <svg
      className="w-12 h-12 mx-auto mb-4 text-[#4e342e]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      ></path>
    </svg>
  ),
  star: (
    <svg
      className="w-12 h-12 mx-auto mb-4 text-[#4e342e]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      ></path>
    </svg>
  ),
  heart: (
    <svg
      className="w-12 h-12 mx-auto mb-4 text-[#4e342e]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      ></path>
    </svg>
  ),
  shield: (
    <svg
      className="w-12 h-12 mx-auto mb-4 text-[#4e342e]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      ></path>
    </svg>
  ),
  clock: (
    <svg
      className="w-12 h-12 mx-auto mb-4 text-[#4e342e]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      ></path>
    </svg>
  ),
  gem: (
    <svg
      className="w-12 h-12 mx-auto mb-4 text-[#4e342e]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      ></path>
    </svg>
  ),
};

// No default pillars — content comes from the database
const DEFAULT_PILLARS: MasteryPillar[] = [];

export default function MasteryPage() {
  const [content, setContent] = useState<MasteryContent | null>(null);
  const [pillars, setPillars] = useState<MasteryPillar[]>(DEFAULT_PILLARS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contentRes, pillarsRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/mastery/public`),
          fetch(`${API_URL}/api/admin/mastery-pillars/public`),
        ]);

        const contentData = await contentRes.json();
        const pillarsData = await pillarsRes.json();

        if (contentData.success) setContent(contentData.data);
        if (
          pillarsData.success &&
          pillarsData.data &&
          pillarsData.data.length > 0
        ) {
          setPillars(pillarsData.data);
        }
      } catch (error) {
        console.error("Failed to fetch mastery content:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getIcon = (iconName: string) => ICON_MAP[iconName] || ICON_MAP.leaf;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfaf6] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#4e342e]"></div>
          <p className="mt-4 text-[#3e2723]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-[#fcfaf6] flex items-center justify-center">
        <p className="text-[#3e2723]">Failed to load content</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfaf6] text-[#3e2723] font-sans antialiased">
      {/* Hero Section */}
      <section className="relative bg-[#4e342e] text-white py-20 md:py-32">
        <div className="absolute inset-0 bg-black/30"></div>
        {content.heroImage && (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                content.heroImage.startsWith("http")
                  ? content.heroImage
                  : `${API_URL}${content.heroImage}`
              }
              alt="Mastery"
              className="w-full h-full object-cover opacity-40"
            />
          </div>
        )}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
            {content.heroTitle}
          </h1>
          <p className="text-lg md:text-xl text-gray-200 max-w-3xl">
            {content.heroSubtitle}
          </p>
        </div>
      </section>

      {/* Statistics Bar */}
      <section className="bg-[#3e2723] py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
            <div>
              <p className="text-4xl md:text-5xl font-bold mb-2">
                {content.yearsExperience}+
              </p>
              <p className="text-gray-300 uppercase tracking-wider text-sm">
                Years of Experience
              </p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold mb-2">
                {content.projectsCompleted}+
              </p>
              <p className="text-gray-300 uppercase tracking-wider text-sm">
                Projects Completed
              </p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold mb-2">
                {content.satisfiedClients}+
              </p>
              <p className="text-gray-300 uppercase tracking-wider text-sm">
                Satisfied Clients
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* History Section */}
      {content.history && (
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#4e342e] mb-8 text-center">
              Our History
            </h2>
            <div
              className="max-w-4xl mx-auto text-gray-700 leading-relaxed text-lg wysiwyg-content"
              dangerouslySetInnerHTML={{
                __html: sanitizeHTML(content.history),
              }}
            />
          </div>
        </section>
      )}

      {/* Pillars of Our Mastery */}
      {pillars.length > 0 && (
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#4e342e] mb-4 text-center">
              Pillars of Our Mastery
            </h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              The foundational principles that guide every piece we create
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pillars.map((pillar) => (
                <div
                  key={pillar.id}
                  className="bg-[#fcfaf6] p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 text-center"
                >
                  {getIcon(pillar.icon)}
                  <h3 className="text-xl font-serif font-bold text-[#4e342e] mb-3">
                    {pillar.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-[#4e342e] text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
            Ready to Experience True Craftsmanship?
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Let us create something extraordinary for you. Our master craftsmen
            are ready to bring your vision to life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/inquire"
              className="px-8 py-3 bg-white text-[#4e342e] font-semibold rounded-lg hover:bg-gray-100 transition duration-300"
            >
              Get in Touch
            </Link>
            <Link
              href="/projects"
              className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition duration-300"
            >
              View Our Work
            </Link>
          </div>
        </div>
      </section>

      {/* WYSIWYG content styles */}
      <style jsx global>{`
        .wysiwyg-content h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        .wysiwyg-content h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        .wysiwyg-content h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        .wysiwyg-content p {
          margin: 0.5em 0;
        }
        .wysiwyg-content ul {
          list-style-type: disc;
          margin-left: 1.5em;
        }
        .wysiwyg-content ol {
          list-style-type: decimal;
          margin-left: 1.5em;
        }
        .wysiwyg-content blockquote {
          border-left: 4px solid #8d6e63;
          padding-left: 1em;
          margin: 1em 0;
          font-style: italic;
          color: #666;
        }
        .wysiwyg-content a {
          color: #4e342e;
          text-decoration: underline;
        }
        .wysiwyg-content img {
          max-width: 100%;
          height: auto;
          margin: 1em 0;
        }
        .wysiwyg-content hr {
          border: none;
          border-top: 2px solid #d7ccc8;
          margin: 1.5em 0;
        }
      `}</style>
    </div>
  );
}
