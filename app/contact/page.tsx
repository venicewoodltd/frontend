"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";

function ContactRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productName = searchParams.get("product") || "";

  useEffect(() => {
    const target = productName
      ? `/inquire?product=${encodeURIComponent(productName)}`
      : "/inquire";
    router.replace(target);
  }, [productName, router]);

  return (
    <div className="min-h-screen bg-[#fcfaf6] flex items-center justify-center">
      <p className="text-gray-600">Redirecting...</p>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fcfaf6] flex items-center justify-center">
          <p className="text-gray-600">Redirecting...</p>
        </div>
      }
    >
      <ContactRedirect />
    </Suspense>
  );
}
