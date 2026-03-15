import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "@/components/Layout/ConditionalLayout";
import PageTracker from "@/components/PageTracker";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://venicewoodltd.com",
  ),
  title: {
    default: "Venice Wood Ltd — Bespoke Woodworking & Fine Furniture",
    template: "%s | Venice Wood Ltd",
  },
  description:
    "Venice Wood Ltd — Bespoke woodworking, fine furniture, and architectural joinery in Mauritius. Custom handcrafted pieces with exceptional craftsmanship.",
  keywords: [
    "woodworking",
    "fine furniture",
    "bespoke furniture",
    "architectural joinery",
    "Mauritius",
    "Venice Wood",
    "custom furniture",
    "handcrafted",
  ],
  authors: [{ name: "Venice Wood Ltd" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Venice Wood Ltd",
    title: "Venice Wood Ltd — Bespoke Woodworking & Fine Furniture",
    description:
      "Custom handcrafted furniture and architectural joinery in Mauritius.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Venice Wood Ltd — Bespoke Woodworking & Fine Furniture",
    description:
      "Custom handcrafted furniture and architectural joinery in Mauritius.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PageTracker />
        <ConditionalLayout>{children}</ConditionalLayout>
      </body>
    </html>
  );
}
