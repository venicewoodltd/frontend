import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Browse our collection of bespoke handcrafted wooden furniture and architectural joinery pieces by Venice Wood Ltd.",
  openGraph: {
    title: "Products | Venice Wood Ltd",
    description:
      "Browse our collection of bespoke handcrafted wooden furniture and architectural joinery pieces.",
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
