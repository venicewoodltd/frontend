import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request a Quote",
  description:
    "Submit an inquiry for custom woodworking, bespoke furniture, or architectural joinery from Venice Wood Ltd in Mauritius.",
  openGraph: {
    title: "Request a Quote | Venice Wood Ltd",
    description:
      "Submit an inquiry for custom woodworking and bespoke furniture.",
  },
};

export default function InquireLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
