import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfaf6] px-4">
      <h1 className="text-6xl font-bold text-[#3e2723] mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-[#4e342e] mb-6">
        Page Not Found
      </h2>
      <p className="text-[#6d4c41] mb-8 text-center max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-[#4e342e] text-white rounded-lg hover:bg-[#3e2723] transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}
