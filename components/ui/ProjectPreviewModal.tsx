"use client";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    name: string;
    slug?: string;
    title: string;
    description: string;
    longDescription?: string;
    category: string;
    mainImage: string;
    galleryImages?: string[];
    featured: boolean;
    status?: string;
    primaryWood?: string;
    client?: string;
    specifications?: Array<{ key: string; value: string }>;
    materials?: string[];
  };
}

export default function ProjectPreviewModal({
  isOpen,
  onClose,
  project,
}: PreviewModalProps) {
  if (!isOpen) return null;

  const API_URL = "";

  const getImageUrl = (imageId: string) => {
    if (!imageId) return "/placeholder-product.svg";
    if (imageId.startsWith("http") || imageId.startsWith("data:"))
      return imageId;
    if (imageId.startsWith("/api/images/")) return `${API_URL}${imageId}`;
    return `${API_URL}/api/images/${imageId}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 backdrop-blur-sm bg-black/50 transition-opacity"
        onClick={onClose}
      />
      <div className="relative min-h-screen flex items-start justify-center p-4 pt-10">
        <div className="relative bg-[#fcfaf6] rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto transform transition-all">
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

          <div className="absolute top-4 left-44 z-10">
            <span
              className={`px-3 py-2 rounded-full text-sm font-medium ${project.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
            >
              {project.status === "published" ? "Published" : "Draft"}
            </span>
          </div>

          {/* Hero Image */}
          <div className="relative h-64 md:h-80 overflow-hidden rounded-t-xl">
            <img
              src={getImageUrl(project.mainImage)}
              alt={project.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder-product.svg";
              }}
            />
            <div className="absolute inset-0 bg-linear-to-r from-[#4e342e]/70 to-transparent flex items-center">
              <div className="px-8">
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">
                  {project.name || "Project Name"}
                </h1>
                <p className="text-lg text-white/90">{project.title}</p>
              </div>
            </div>
          </div>

          {/* Project Overview */}
          <div className="py-8 bg-white">
            <div className="px-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                <div className="border-l-4 border-[#4e342e] pl-4">
                  <p className="text-sm text-gray-600 mb-1">Client</p>
                  <p className="text-base font-semibold text-[#3e2723]">
                    {project.client || "Private Residence"}
                  </p>
                </div>
                <div className="border-l-4 border-[#4e342e] pl-4">
                  <p className="text-sm text-gray-600 mb-1">Category</p>
                  <p className="text-base font-semibold text-[#3e2723] capitalize">
                    {project.category}
                  </p>
                </div>
                <div className="border-l-4 border-[#4e342e] pl-4">
                  <p className="text-sm text-gray-600 mb-1">Primary Wood</p>
                  <p className="text-base font-semibold text-[#3e2723]">
                    {project.primaryWood || "Various"}
                  </p>
                </div>
              </div>

              <div className="prose prose-sm max-w-3xl text-[#3e2723] leading-relaxed space-y-4">
                <p>{project.description}</p>
                {project.longDescription && (
                  <div className="whitespace-pre-line">
                    {project.longDescription}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Gallery */}
          {project.galleryImages && project.galleryImages.length > 0 && (
            <div className="py-8 bg-[#fcfaf6]">
              <div className="px-8">
                <h2 className="text-2xl font-serif font-bold text-[#4e342e] mb-6">
                  Project Gallery
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {project.galleryImages.map((img, index) => (
                    <div
                      key={index}
                      className="rounded-lg overflow-hidden shadow-lg border border-[#d7ccc8]"
                    >
                      <img
                        src={getImageUrl(img)}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/placeholder-product.svg";
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Details */}
          {(project.specifications || project.materials) && (
            <div className="py-8 bg-white">
              <div className="px-8">
                <h2 className="text-2xl font-serif font-bold text-[#4e342e] mb-6">
                  Project Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {project.materials && project.materials.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-[#3e2723]">
                        Materials &amp; Techniques
                      </h3>
                      <ul className="space-y-2 text-gray-700">
                        {project.materials.map((material, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-[#4e342e] font-bold mt-1">
                              &bull;
                            </span>
                            <span>{material}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="py-8 bg-[#fcfaf6] rounded-b-xl">
            <div className="px-8 text-center">
              <h2 className="text-2xl font-serif font-bold text-[#4e342e] mb-2">
                Inspired to Commission Your Project?
              </h2>
              <p className="text-gray-600 mb-4">
                Let&apos;s discuss how we can bring your vision to life.
              </p>
              <button
                onClick={onClose}
                className="inline-block px-8 py-3 bg-[#4e342e] text-white font-semibold rounded-lg hover:bg-[#3e2723] transition duration-300 uppercase tracking-widest text-sm"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
