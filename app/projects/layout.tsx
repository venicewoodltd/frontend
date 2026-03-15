import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Explore our portfolio of completed woodworking projects — custom furniture, architectural joinery, and interior installations by Venice Wood Ltd.",
  openGraph: {
    title: "Projects | Venice Wood Ltd",
    description:
      "Explore our portfolio of completed woodworking projects and installations.",
  },
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
