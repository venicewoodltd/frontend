"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfaf6] px-4">
      <h1 className="text-5xl font-bold text-[#3e2723] mb-4">
        Something went wrong
      </h1>
      <p className="text-[#6d4c41] mb-8 text-center max-w-md">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
