"use client";

import { usePathname } from "next/navigation";
import NavBar from "./NavBar";
import Footer from "./Footer";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({
  children,
}: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const isHomePage = pathname === "/";

  if (isAdminRoute || isHomePage) {
    return <>{children}</>;
  }

  return (
    <>
      <NavBar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
