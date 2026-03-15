"use client";

import { useState, useEffect } from "react";
import { sanitizeHTML } from "@/lib/sanitize";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function TermsConditionsPage() {
  const [title, setTitle] = useState("Terms and Conditions");
  const [content, setContent] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const response = await fetch(`${API_URL}/api/legal/terms-conditions`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setTitle(data.title || "Terms and Conditions");
            setContent(data.content || "");
            setLastUpdated(data.lastUpdated || null);
          }
        }
      } catch (err) {
        console.error("Failed to fetch terms:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTerms();
  }, []);

  return (
    <div className="min-h-screen bg-[#fcfaf6] text-[#3e2723] font-sans antialiased">
      {/* Hero Section */}
      <section className="bg-[#4e342e] text-white py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            {title}
          </h1>
          {lastUpdated && (
            <p className="text-gray-300 text-sm">
              Last updated:{" "}
              {new Date(lastUpdated).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : content ? (
            <div
              className="prose prose-lg max-w-none text-[#3e2723] prose-headings:text-[#4e342e] prose-headings:font-serif prose-a:text-[#4e342e] prose-a:underline"
              dangerouslySetInnerHTML={{ __html: sanitizeHTML(content) }}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Terms and conditions content has not been added yet.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
