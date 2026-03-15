import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Venice Wood Ltd for custom furniture inquiries, project consultations, and bespoke woodworking services in Mauritius.",
  openGraph: {
    title: "Contact Us | Venice Wood Ltd",
    description:
      "Get in touch for custom furniture inquiries and project consultations.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
