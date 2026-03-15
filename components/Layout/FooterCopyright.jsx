"use client";

import Link from "next/link";

const FooterCopyright = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-4 border-t border-amber-200 text-center text-gray-500">
      <p>
        &copy; {new Date().getFullYear()} VeniceWoodLtd. All rights reserved. |{" "}
        <Link
          href="/privacy-policy"
          className="hover:text-[#4e342e] transition"
        >
          Privacy Policy
        </Link>{" "}
        |{" "}
        <Link
          href="/terms-conditions"
          className="hover:text-[#4e342e] transition"
        >
          Terms &amp; Conditions
        </Link>
      </p>
    </div>
  );
};

export default FooterCopyright;
