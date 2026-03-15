"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import InquiryForm from "@/components/Forms/InquiryForm";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const defaultFaqs = [
  {
    q: "How long does it take to complete a custom project?",
    a: "Timeline varies based on project complexity, but typically ranges from 3-6 months. Simpler pieces may take 4-8 weeks, while elaborate commissions can take 12+ months.",
  },
  {
    q: "What is your design consultation process?",
    a: "We start with an initial consultation to understand your vision. This is followed by design sketches, material selection, and approval stages before production begins.",
  },
  {
    q: "Can I visit the studio?",
    a: "Yes! We welcome studio visits by appointment. You can see our work in progress and meet our craftsmen.",
  },
  {
    q: "Do you work internationally?",
    a: "Absolutely. We ship our pieces worldwide and have completed commissions across Europe, North America, and the Middle East.",
  },
];

function InquireContent() {
  const searchParams = useSearchParams();
  const productName = searchParams.get("product") || "";
  const [faqs, setFaqs] = useState(defaultFaqs);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/contact/public`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.faqs?.length > 0) {
            setFaqs(data.data.faqs);
          }
        }
      } catch {
        // Use default FAQs
      }
    };
    fetchFaqs();
  }, []);

  return (
    <div className="min-h-screen bg-[#fcfaf6] text-[#3e2723] font-sans">
      {/* PAGE HEADER / HERO SECTION */}
      <div className="bg-[#fcfaf6] py-12 md:py-16 border-b border-[#d7ccc8]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#4e342e] mb-4">
            Start Your Commission
          </h1>
          <p className="text-gray-600 max-w-3xl">
            Tell us about your vision. Whether its a custom piece of furniture,
            architectural millwork, or complete interior transformation, were
            here to bring your ideas to life.
          </p>
        </div>
      </div>

      {/* INQUIRY FORM SECTION */}
      <InquiryForm productName={productName} />

      {/* FAQ SECTION */}
      {faqs.length > 0 && (
        <div className="py-16 md:py-20 bg-white border-t border-[#d7ccc8]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
            <h2 className="text-3xl font-serif font-bold text-[#4e342e] mb-12 text-center">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="border-b border-[#d7ccc8] pb-6 last:border-b-0"
                >
                  <h3 className="text-lg font-bold text-[#3e2723] mb-2">
                    {faq.q}
                  </h3>
                  <p className="text-gray-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InquirePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fcfaf6] flex items-center justify-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      }
    >
      <InquireContent />
    </Suspense>
  );
}
