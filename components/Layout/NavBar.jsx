"use client";

import { useState } from "react";
import NavBarTitle from "./NavBarTitle";
import QuickLinks from "./QuickLinks";
import SearchBar from "./SearchBar";

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mobileMenuLinks = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: "Projects", href: "/projects" },
    { label: "Mastery", href: "/mastery" },
    { label: "Blog", href: "/blog" },
    { label: "Inquire", href: "/inquire" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-lg shadow-gray-200/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <NavBarTitle />
        <div className="flex items-center space-x-3 sm:space-x-6">
          <QuickLinks />
          <SearchBar />
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-[#4e342e] hover:bg-gray-100 transition duration-300"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <nav className="lg:hidden px-4 pb-4 bg-white border-t border-[#d7ccc8]">
          {mobileMenuLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="block py-2 text-sm text-gray-800 hover:text-[#4e342e] transition duration-300 border-b border-gray-100"
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
};

export default NavBar;
