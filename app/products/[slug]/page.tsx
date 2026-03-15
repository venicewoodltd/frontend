"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useProducts } from "@/lib/graphql";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  longDescription?: string;
  price: string | number;
  category: string;
  image?: string;
  galleryImages?: string[];
  stock: number;
  featured: boolean;
  status?: string;
  wood_type?: string;
  material?: string;
  specifications?: Array<{ key: string; value: string }>;
  whatsappText?: string;
  emailText?: string;
  createdAt?: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { getProductBySlug, getFeaturedProducts } = useProducts();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [mainImage, setMainImage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        // Fetch product by slug
        const result = await getProductBySlug(slug);
        if (result?.productBySlug) {
          // Check if product is published - draft products should not be accessible
          if (result.productBySlug.status === "draft") {
            setError("Product not found");
            return;
          }

          setProduct(result.productBySlug);
          setMainImage(result.productBySlug.image);

          // Fetch related products
          const featuredResult = await getFeaturedProducts(3);
          const featured = (featuredResult?.featuredProducts || []).filter(
            (p: any) => p.id !== result.productBySlug.id,
          );
          setRelatedProducts(featured.slice(0, 3));
        } else {
          setError("Product not found");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load product");
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug, getProductBySlug, getFeaturedProducts]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <p className="text-[#3e2723] text-lg">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex justify-center items-center py-32">
        <p className="text-red-600 text-lg">{error || "Product not found"}</p>
      </div>
    );
  }

  const getImageUrl = (url: string | undefined) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${API_URL}${url}`;
  };

  const mainImageUrl = getImageUrl(product.image);

  const whatsappMessage = product.whatsappText
    ? product.whatsappText
    : `Hello Venice Wood Ltd, I am interested in your ${product.name}. Please provide more information.${mainImageUrl ? `\n\nProduct: ${product.name}\nImage: ${mainImageUrl}` : ""}`;
  const whatsappUrl = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "23057123456"}?text=${encodeURIComponent(
    whatsappMessage,
  )}`;
  const emailSubject = `Inquiry about ${product.name}`;
  const emailBody = product.emailText
    ? product.emailText
    : `Hello Venice Wood Ltd,\n\nI am interested in your ${product.name} product.\n\nPlease provide more information about pricing, availability, and customization options.${mainImageUrl ? `\n\nProduct: ${product.name}\nImage: ${mainImageUrl}` : ""}\n\nThank you,`;

  return (
    <div className="min-h-screen bg-[#fcfaf6] text-[#3e2723] font-sans">
      {/* BREADCRUMB */}
      <div className="bg-white border-b border-[#d7ccc8] py-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-sm text-gray-600">
          <a href="/" className="hover:text-[#4e342e]">
            Home
          </a>{" "}
          /{" "}
          <a href="/products" className="hover:text-[#4e342e]">
            Products
          </a>{" "}
          /<span className="text-[#3e2723] font-semibold"> {product.name}</span>
        </div>
      </div>

      {/* PRODUCT DETAIL SECTION */}
      <div className="py-12 md:py-16 bg-[#fcfaf6]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-[#d7ccc8]">
                <img
                  src={getImageUrl(mainImage || product.image)}
                  alt={product.name}
                  className="w-full h-96 object-cover"
                />
              </div>

              {/* Thumbnail Gallery */}
              <div className="flex gap-3 overflow-x-auto">
                {product.image && (
                  <img
                    src={getImageUrl(product.image)}
                    alt="Main View"
                    className={`w-20 h-20 rounded-lg border-2 cursor-pointer transition ${
                      mainImage === product.image
                        ? "border-[#4e342e]"
                        : "border-[#d7ccc8]"
                    }`}
                    onClick={() => setMainImage(product.image || "")}
                  />
                )}
                {product.galleryImages &&
                  product.galleryImages.map((img: string, idx: number) => (
                    <img
                      key={idx}
                      src={getImageUrl(img)}
                      alt={`Gallery ${idx + 1}`}
                      className={`w-20 h-20 rounded-lg border-2 cursor-pointer transition ${
                        mainImage === img
                          ? "border-[#4e342e]"
                          : "border-[#d7ccc8]"
                      }`}
                      onClick={() => setMainImage(img)}
                    />
                  ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <span className="inline-block text-xs text-[#4e342e] font-semibold uppercase mb-2 tracking-widest bg-[#d7ccc8]/30 px-3 py-1 rounded-full">
                  {product.category}
                </span>
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#4e342e] mb-3">
                  {product.name}
                </h1>
                <p className="text-gray-600 text-lg">
                  {product.description || "Premium handcrafted wooden product"}
                </p>
              </div>

              {/* Product Details */}
              <div className="space-y-3">
                <h3 className="font-bold text-[#4e342e] text-lg">
                  Specifications
                </h3>
                <ul className="space-y-2 text-gray-700">
                  {product.wood_type && (
                    <li className="flex justify-between border-b border-[#d7ccc8]/50 pb-2">
                      <span className="font-semibold">Wood Type:</span>
                      <span>{product.wood_type}</span>
                    </li>
                  )}
                  {product.material && (
                    <li className="flex justify-between border-b border-[#d7ccc8]/50 pb-2">
                      <span className="font-semibold">Material:</span>
                      <span>{product.material}</span>
                    </li>
                  )}
                  {product.specifications &&
                    product.specifications.length > 0 &&
                    product.specifications.map((spec, idx) => (
                      <li
                        key={idx}
                        className="flex justify-between border-b border-[#d7ccc8]/50 pb-2"
                      >
                        <span className="font-semibold">{spec.key}:</span>
                        <span>{spec.value}</span>
                      </li>
                    ))}
                </ul>
              </div>

              {/* Inquiry Buttons */}
              <div className="space-y-4 border-t border-[#d7ccc8] pt-6 mt-6">
                <h3 className="text-lg font-semibold text-[#4e342e] mb-4">
                  Interested in this product?
                </h3>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-8 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition duration-300 flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004c-1.749 0-3.469-.466-4.967-1.349l-.357-.212-3.694.969.985-3.601-.232-.369A9.867 9.867 0 012.163 12c0-5.46 4.436-9.901 9.889-9.901 2.642 0 5.127 1.03 6.993 2.898a9.856 9.856 0 012.893 7.009c-.001 5.46-4.44 9.901-9.894 9.901zm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Inquire via WhatsApp
                </a>
                <a
                  href={`/inquire?product=${encodeURIComponent(product.name)}`}
                  className="w-full px-8 py-3 bg-[#4e342e] text-white font-semibold rounded-lg hover:bg-[#3e2723] transition duration-300 flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                  Inquire via Email
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DESCRIPTION SECTION */}
      <div className="py-12 md:py-16 bg-white border-t border-[#d7ccc8]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-serif font-bold text-[#4e342e] mb-6">
            About This Piece
          </h2>
          <div className="space-y-4 text-gray-700 leading-relaxed max-w-3xl">
            {(product.longDescription || product.description || "")
              .split(/\n\n+/)
              .filter((p: string) => p.trim())
              .map((paragraph: string, idx: number) => (
                <p key={idx}>{paragraph.trim()}</p>
              ))}
            {!product.longDescription && !product.description && (
              <p>
                Each piece from Venice Wood Ltd is meticulously crafted using
                traditional woodworking techniques combined with contemporary
                design sensibilities. Our commitment to quality ensures your
                piece will be treasured for generations.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <div className="py-12 md:py-16 bg-[#fcfaf6]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-serif font-bold text-[#4e342e] mb-8">
              You May Also Like
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedProducts.map((relatedProduct: any) => (
                <a
                  key={relatedProduct.id}
                  href={`/products/${relatedProduct.slug}`}
                  className="bg-white rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition duration-500 border border-[#d7ccc8]"
                >
                  <div className="relative overflow-hidden h-48">
                    {relatedProduct.image ? (
                      <img
                        src={relatedProduct.image}
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover hover:scale-110 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <p className="text-xs text-[#4e342e] font-semibold uppercase mb-2 tracking-widest">
                      {relatedProduct.category}
                    </p>
                    <h3 className="text-lg font-bold font-serif text-[#3e2723] mb-2">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {relatedProduct.description}
                    </p>
                    <div className="flex justify-end items-center">
                      <span className="text-sm text-[#4e342e] hover:text-[#3e2723] font-semibold">
                        View →
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CTA SECTION */}
      <div className="py-16 md:py-20 bg-[#4e342e] text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
            Ready to Commission This Piece?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Contact us today to discuss delivery, customization options, or to
            place an order.
          </p>
          <a
            href="/inquire"
            className="inline-block px-10 py-4 bg-white text-[#4e342e] font-semibold rounded-lg hover:bg-[#fcfaf6] transition duration-300 uppercase tracking-widest"
          >
            Get in Touch
          </a>
        </div>
      </div>
    </div>
  );
}
