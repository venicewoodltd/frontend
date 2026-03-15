"use client";

import Link from "next/link";

const QuickLinks = () => {
  const links = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: "Projects", href: "/projects" },
    { label: "Mastery", href: "/mastery" },
    { label: "Blog", href: "/blog" },
    { label: "Inquire", href: "/inquire" },
  ];

  return (
    <nav className="hidden lg:flex space-x-6 text-sm font-medium">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-gray-800 hover:text-[#4e342e] transition duration-300"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
};

export default QuickLinks;
