"use client";

export default function LoadingDots({ className = "" }) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <span className="animate-bounce mx-0.5" style={{ animationDelay: "0ms" }}>
        .
      </span>
      <span
        className="animate-bounce mx-0.5"
        style={{ animationDelay: "150ms" }}
      >
        .
      </span>
      <span
        className="animate-bounce mx-0.5"
        style={{ animationDelay: "300ms" }}
      >
        .
      </span>
    </span>
  );
}
