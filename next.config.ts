import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const apiHostname = (() => {
  try {
    return new URL(API_URL).hostname;
  } catch {
    return "localhost";
  }
})();
const apiProtocol = (() => {
  try {
    return new URL(API_URL).protocol.replace(":", "") as "http" | "https";
  } catch {
    return "http" as const;
  }
})();
const apiPort = (() => {
  try {
    return new URL(API_URL).port;
  } catch {
    return "4000";
  }
})();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      {
        protocol: apiProtocol,
        hostname: apiHostname,
        ...(apiPort ? { port: apiPort } : {}),
        pathname: "/api/images/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/images/:path*",
        destination: `${API_URL}/api/images/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
