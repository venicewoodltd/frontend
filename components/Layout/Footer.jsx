"use client";

import FooterCompanyInfo from "./FooterCompanyInfo";
import FooterNavigation from "./FooterNavigation";
import FooterLegal from "./FooterLegal";
import FooterSpecialties from "./FooterSpecialties";
import FooterContact from "./FooterContact";
import FooterCopyright from "./FooterCopyright";

const Footer = () => {
  return (
    <div className="bg-white border-t border-[#d7ccc8] pt-10 pb-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-5 gap-8 text-sm">
        <FooterCompanyInfo />
        <FooterNavigation />
        <FooterLegal />
        <FooterSpecialties />
        <FooterContact />
      </div>
      <FooterCopyright />
    </div>
  );
};

export default Footer;
