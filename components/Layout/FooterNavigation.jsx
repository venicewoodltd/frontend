"use client";

const FooterNavigation = () => {
  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: "Projects", href: "/projects" },
    { label: "Mastery", href: "/mastery" },
    { label: "Blog", href: "/blog" },
    { label: "Inquire", href: "/inquire" },
  ];

  return (
    <div>
      <h4 className="font-semibold text-[#4e342e] mb-4 uppercase tracking-wider">
        Quick Links
      </h4>
      <ul className="space-y-2">
        {navLinks.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="text-gray-600 hover:text-[#4e342e] transition duration-300"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FooterNavigation;
