"use client";

import { useState } from "react";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    name: string;
    slug?: string;
    description: string;
    longDescription?: string;
    category: string;
    mainImage: string;
    galleryImages?: string[];
    featured: boolean;
    status?: string;
    wood_type?: string;
    material?: string;
    specifications?: Array<{ key: string; value: string }>;
    whatsappText?: string;
    emailText?: string;
  };
}

export default function ProductPreviewModal({
  isOpen,
  onClose,
  product,
}: PreviewModalProps) {
  const [mainImage, setMainImage] = useState("");

  if (!isOpen) return null;

  const API_URL = "";

  const getImageUrl = (imageId: string) => {
    if (!imageId) return "/placeholder-product.svg";
    if (imageId.startsWith("http") || imageId.startsWith("data:"))
      return imageId;
    if (imageId.startsWith("/api/images/")) return `${API_URL}${imageId}`;
    return `${API_URL}/api/images/${imageId}`;
  };

  const currentMainImage = mainImage || getImageUrl(product.mainImage);
  const mainImageUrl = getImageUrl(product.mainImage);
  const whatsappMessage = product.whatsappText
    ? product.whatsappText
    : `Hello Venice Wood Ltd, I am interested in your ${product.name}. Please provide more information.${mainImageUrl ? `\n\nProduct: ${product.name}\nImage: ${mainImageUrl}` : ""}`;
  const whatsappUrl = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "23057123456"}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 backdrop-blur-sm bg-white/30 transition-opacity"
        onClick={onClose}
      />
      <div className="relative min-h-screen flex items-start justify-center p-4 pt-10">
        <div className="relative bg-[#fcfaf6] rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto transform transition-all border border-gray-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="absolute top-4 left-4 z-10 bg-[#4e342e] text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Preview Mode
          </div>

          {/* Breadcrumb */}
          <div className="bg-white border-b border-[#d7ccc8] py-4 px-8 rounded-t-xl mt-12">
            <div className="text-sm text-gray-600">
              <span className="hover:text-[#4e342e]">Home</span> /{" "}
              <span className="hover:text-[#4e342e]">Products</span> /
              <span className="text-[#3e2723] font-semibold">
                {" "}
                {product.name}
              </span>
            </div>
          </div>

          {/* Product Detail */}
          <div className="py-12 px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-[#d7ccc8]">
                  <img
                    src={currentMainImage}
                    alt={product.name}
                    className="w-full h-96 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/placeholder-product.svg";
                    }}
                  />
                </div>
                <div className="flex gap-3 overflow-x-auto">
                  {product.mainImage && (
                    <img
                      src={getImageUrl(product.mainImage)}
                      alt="Main View"
                      className={`w-20 h-20 rounded-lg border-2 cursor-pointer transition object-cover ${currentMainImage === getImageUrl(product.mainImage) ? "border-[#4e342e]" : "border-[#d7ccc8]"}`}
                      onClick={() =>
                        setMainImage(getImageUrl(product.mainImage))
                      }
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/placeholder-product.svg";
                      }}
                    />
                  )}
                  {product.galleryImages?.map((img, idx) => (
                    <img
                      key={idx}
                      src={getImageUrl(img)}
                      alt={`Gallery ${idx + 1}`}
                      className={`w-20 h-20 rounded-lg border-2 cursor-pointer transition object-cover ${currentMainImage === getImageUrl(img) ? "border-[#4e342e]" : "border-[#d7ccc8]"}`}
                      onClick={() => setMainImage(getImageUrl(img))}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/placeholder-product.svg";
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <span className="inline-block text-xs text-[#4e342e] font-semibold uppercase mb-2 tracking-widest bg-[#d7ccc8]/30 px-3 py-1 rounded-full">
                    {product.category}
                  </span>
                  {product.featured && (
                    <span className="inline-block ml-2 text-xs text-blue-700 font-semibold uppercase mb-2 tracking-widest bg-blue-100 px-3 py-1 rounded-full">
                      Featured
                    </span>
                  )}
                  {product.status && (
                    <span
                      className={`inline-block ml-2 text-xs font-semibold uppercase mb-2 tracking-widest px-3 py-1 rounded-full ${product.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                    >
                      {product.status === "published" ? "Published" : "Draft"}
                    </span>
                  )}
                  <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#4e342e] mb-3">
                    {product.name || "Product Name"}
                  </h1>
                  <p className="text-gray-600 text-lg">
                    {product.description ||
                      "Premium handcrafted wooden product"}
                  </p>
                </div>

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
                    {product.specifications?.map((spec, idx) => (
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

          {/* Description */}
          <div className="py-12 bg-white border-t border-[#d7ccc8]">
            <div className="px-8">
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
                    Each piece from Venice Wood Ltd is meticulously crafted
                    using traditional woodworking techniques combined with
                    contemporary design sensibilities.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="py-16 bg-[#4e342e] text-white rounded-b-xl">
            <div className="px-8 text-center">
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
                Ready to Commission This Piece?
              </h2>
              <p className="text-lg mb-8 opacity-90">
                Contact us today to discuss delivery, customization options, or
                to place an order.
              </p>
              <span className="inline-block px-10 py-4 bg-white text-[#4e342e] font-semibold rounded-lg uppercase tracking-widest cursor-default">
                Get in Touch
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
