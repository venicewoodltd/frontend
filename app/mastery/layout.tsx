import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Mastery",
  description:
    "Discover the craftsmanship, techniques, and expertise behind Venice Wood Ltd's bespoke woodworking and fine furniture.",
  openGraph: {
    title: "Our Mastery | Venice Wood Ltd",
    description:
      "Discover the craftsmanship and expertise behind our bespoke woodworking.",
  },
};

export default function MasteryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
