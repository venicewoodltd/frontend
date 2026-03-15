"use client";

import Link from "next/link";

const FooterLegal = () => {
  const legalLinks = [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms-conditions" },
  ];

  return (
    <div>
      <h4 className="font-semibold text-[#4e342e] mb-4 uppercase tracking-wider">
        Legal
      </h4>
      <ul className="space-y-2">
        {legalLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-gray-600 hover:text-[#4e342e] transition duration-300"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FooterLegal;
