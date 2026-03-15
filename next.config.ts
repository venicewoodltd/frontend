import type { NextConfig } from "next";

// Server-side backend URL for rewrites (not exposed to client)
const BACKEND_URL =
  process.env.API_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";
const apiHostname = (() => {
  try {
    return new URL(BACKEND_URL).hostname;
  } catch {
    return "localhost";
  }
})();
const apiProtocol = (() => {
  try {
    return new URL(BACKEND_URL).protocol.replace(":", "") as "http" | "https";
  } catch {
    return "http" as const;
  }
})();
const apiPort = (() => {
  try {
    return new URL(BACKEND_URL).port;
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
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
      {
        source: "/graphql",
        destination: `${BACKEND_URL}/graphql`,
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
          { key: "X-XSS-Protection", value: "0" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https: http:",
              `connect-src 'self' https://api.emailjs.com`,
              "font-src 'self' https://fonts.gstatic.com",
              "frame-src 'none'",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
