"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface FaqItem {
  q: string;
  a: string;
}

export default function FaqSettingsTab() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const fetchFaqs = useCallback(async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/admin/contact`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setFaqs(data.data?.faqs || []);
      }
    } catch {
      showToast({ type: "error", title: "Failed to load FAQs" });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const handleFaqChange = (index: number, field: "q" | "a", value: string) => {
    setFaqs((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addFaq = () => {
    setFaqs((prev) => [...prev, { q: "", a: "" }]);
  };

  const removeFaq = (index: number) => {
    setFaqs((prev) => prev.filter((_, i) => i !== index));
  };

  const moveFaq = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= faqs.length) return;
    setFaqs((prev) => {
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
  };

  const handleSave = async () => {
    const validFaqs = faqs.filter((f) => f.q.trim() && f.a.trim());
    if (validFaqs.length === 0 && faqs.length > 0) {
      showToast({ type: "error", title: "Each FAQ must have both a question and answer" });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      // First get current settings so we don't overwrite other fields
      const getRes = await fetch(`${API_URL}/api/admin/contact`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const currentData = getRes.ok ? await getRes.json() : { data: {} };
      const current = currentData.data || {};

      const response = await fetch(`${API_URL}/api/admin/contact`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studioLocation: current.studioLocation || "Bel Air Riviere Seche, Mauritius",
          email: current.email || "info@venicewoodltd.com",
          phone: current.phone || "+230 5712 3456",
          responseTime: current.responseTime || "We typically respond within 24 hours.",
          facebookUrl: current.facebookUrl || "",
          whatsappNumber: current.whatsappNumber || "+23057123456",
          instagramUrl: current.instagramUrl || "",
          faqs: validFaqs,
        }),
      });

      if (response.ok) {
        setFaqs(validFaqs);
        showToast({ type: "success", title: "FAQs saved successfully" });
      } else {
        throw new Error("Failed to save");
      }
    } catch {
      showToast({ type: "error", title: "Failed to save FAQs" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">Loading FAQs...</div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#4e342e]">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage the FAQ section displayed on the inquiry page.
          </p>
        </div>
        <button
          onClick={addFaq}
          className="px-4 py-2 bg-[#4e342e] text-white text-sm rounded-lg hover:bg-[#3e2723] transition"
        >
          + Add FAQ
        </button>
      </div>

      {faqs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No FAQs yet</p>
          <p className="text-sm">
            Click &quot;Add FAQ&quot; to create your first question and answer.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-[#d7ccc8] rounded-lg p-4 bg-[#fcfaf6]"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="text-sm font-bold text-[#4e342e] mt-2 shrink-0">
                  #{index + 1}
                </span>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => moveFaq(index, "up")}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-[#4e342e] disabled:opacity-30"
                    title="Move up"
                  >
                    &#9650;
                  </button>
                  <button
                    onClick={() => moveFaq(index, "down")}
                    disabled={index === faqs.length - 1}
                    className="p-1 text-gray-400 hover:text-[#4e342e] disabled:opacity-30"
                    title="Move down"
                  >
                    &#9660;
                  </button>
                  <button
                    onClick={() => removeFaq(index)}
                    className="p-1 text-red-400 hover:text-red-600 ml-1"
                    title="Remove FAQ"
                  >
                    &#10005;
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-[#4e342e] mb-1">
                    Question
                  </label>
                  <input
                    type="text"
                    value={faq.q}
                    onChange={(e) =>
                      handleFaqChange(index, "q", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-[#d7ccc8] rounded-lg text-sm focus:ring-[#4e342e] focus:border-[#4e342e]"
                    placeholder="Enter the question..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#4e342e] mb-1">
                    Answer
                  </label>
                  <textarea
                    value={faq.a}
                    onChange={(e) =>
                      handleFaqChange(index, "a", e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-[#d7ccc8] rounded-lg text-sm focus:ring-[#4e342e] focus:border-[#4e342e]"
                    placeholder="Enter the answer..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-2 rounded-lg font-semibold text-white transition ${
            saving
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#4e342e] hover:bg-[#3e2723]"
          }`}
        >
          {saving ? "Saving..." : "Save FAQs"}
        </button>
      </div>
    </div>
  );
}
