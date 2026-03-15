import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Read expert insights on woodworking, furniture care, design trends, and craftsmanship from Venice Wood Ltd.",
  openGraph: {
    title: "Blog | Venice Wood Ltd",
    description:
      "Expert insights on woodworking, furniture care, and design trends.",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
