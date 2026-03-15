"use client";

import { useState, useEffect } from "react";
import WYSIWYGEditor from "@/components/ui/WYSIWYGEditor";
import { useToast } from "@/components/ui/Toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type ActivePage = "privacy" | "terms";

export default function LegalPagesTab() {
  const [activePage, setActivePage] = useState<ActivePage>("privacy");
  const [privacyContent, setPrivacyContent] = useState("");
  const [privacyTitle, setPrivacyTitle] = useState("Privacy Policy");
  const [termsContent, setTermsContent] = useState("");
  const [termsTitle, setTermsTitle] = useState("Terms and Conditions");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { showToast } = useToast();
  const [lastUpdated, setLastUpdated] = useState<{
    privacy: string | null;
    terms: string | null;
  }>({ privacy: null, terms: null });

  const adminToken =
    typeof window !== "undefined" ? localStorage.getItem("adminToken") : "";

  const fetchLegalPages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/legal`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (!response.ok) throw new Error("Failed to fetch legal pages");

      const data = await response.json();
      if (data.success) {
        setPrivacyTitle(data.privacyPolicy?.title || "Privacy Policy");
        setPrivacyContent(data.privacyPolicy?.content || "");
        setTermsTitle(data.termsConditions?.title || "Terms and Conditions");
        setTermsContent(data.termsConditions?.content || "");
        setLastUpdated({
          privacy: data.privacyPolicy?.lastUpdated || null,
          terms: data.termsConditions?.lastUpdated || null,
        });
      }
    } catch (err: unknown) {
      setError(
        `Error loading legal pages: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLegalPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const endpoint =
        activePage === "privacy" ? "privacy-policy" : "terms-conditions";
      const title = activePage === "privacy" ? privacyTitle : termsTitle;
      const content = activePage === "privacy" ? privacyContent : termsContent;

      const response = await fetch(`${API_URL}/api/admin/legal/${endpoint}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) throw new Error("Failed to save");

      const data = await response.json();
      if (data.success) {
        setSuccess(
          `${activePage === "privacy" ? "Privacy Policy" : "Terms and Conditions"} saved successfully!`,
        );
        showToast({
          type: "success",
          title: "Legal Page Saved",
          message: `${activePage === "privacy" ? "Privacy Policy" : "Terms and Conditions"} saved successfully!`,
        });
        setLastUpdated((prev) => ({
          ...prev,
          [activePage]: new Date().toISOString(),
        }));
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Save failed");
        showToast({
          type: "error",
          title: "Save Failed",
          message: data.error || "Save failed",
        });
      }
    } catch (err: unknown) {
      setError(
        `Error saving: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      showToast({
        type: "error",
        title: "Save Error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading legal pages...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setActivePage("privacy")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activePage === "privacy"
              ? "bg-[#4e342e] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Privacy Policy
        </button>
        <button
          onClick={() => setActivePage("terms")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activePage === "terms"
              ? "bg-[#4e342e] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Terms & Conditions
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Editor */}
      {activePage === "privacy" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-serif font-bold text-[#4e342e]">
              Privacy Policy
            </h3>
            {lastUpdated.privacy && (
              <span className="text-xs text-gray-500">
                Last updated:{" "}
                {new Date(lastUpdated.privacy).toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Page Title
            </label>
            <input
              type="text"
              value={privacyTitle}
              onChange={(e) => setPrivacyTitle(e.target.value)}
              className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:ring-[#4e342e] focus:border-[#4e342e] transition"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Content
            </label>
            <WYSIWYGEditor
              value={privacyContent}
              onChange={setPrivacyContent}
              placeholder="Write your privacy policy here..."
              minHeight="500px"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-serif font-bold text-[#4e342e]">
              Terms and Conditions
            </h3>
            {lastUpdated.terms && (
              <span className="text-xs text-gray-500">
                Last updated:{" "}
                {new Date(lastUpdated.terms).toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Page Title
            </label>
            <input
              type="text"
              value={termsTitle}
              onChange={(e) => setTermsTitle(e.target.value)}
              className="w-full px-4 py-2 border border-[#d7ccc8] rounded-lg focus:ring-[#4e342e] focus:border-[#4e342e] transition"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Content
            </label>
            <WYSIWYGEditor
              value={termsContent}
              onChange={setTermsContent}
              placeholder="Write your terms and conditions here..."
              minHeight="500px"
            />
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition font-semibold disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : `Save ${activePage === "privacy" ? "Privacy Policy" : "Terms & Conditions"}`}
        </button>
      </div>
    </div>
  );
}
