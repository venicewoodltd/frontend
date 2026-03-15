"use client";

import NavBar from "@/components/Layout/NavBar";
import Footer from "@/components/Layout/Footer";
import HeroCarousel from "@/components/Home/Hero";
import Mission from "@/components/Home/Mission";
import Testimonials from "@/components/Home/Testimonials";
import Products from "@/components/Products/Products";
import Projects from "@/components/Projects/Projects";
import Blog from "@/components/Blog/Blog";
import InquiryForm from "@/components/Forms/InquiryForm";

export default function Home() {
  return (
    <main className="w-full bg-white text-gray-800 font-sans">
      <NavBar />
      <HeroCarousel />
      <Products />
      <Projects />
      <Mission />
      <Testimonials />
      <Blog />
      <InquiryForm />
      <Footer />
    </main>
  );
}
