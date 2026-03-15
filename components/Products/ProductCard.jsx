"use client";

const API_URL = "";

const ProductCard = ({ product, delay }) => {
  const { name, description, image, slug } = product;
  const imageUrl = image
    ? image.startsWith("http")
      ? image
      : `${API_URL}${image}`
    : null;

  return (
    <div
      className="bg-[#fcfaf6] rounded-xl shadow-2xl overflow-hidden hover:shadow-[#4e342e]/20 transition duration-500 border border-[#d7ccc8]"
      style={{ transitionDelay: delay }}
    >
      <img
        src={imageUrl || "/placeholder.jpg"}
        alt={name}
        className="w-full h-56 object-cover border-b-4 border-[#4e342e]/70"
      />
      <div className="p-6">
        <h3 className="text-xl font-bold font-serif text-[#4e342e] mb-2">
          {name}
        </h3>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        <div className="flex justify-end">
          <a
            href={slug ? `/products/${slug}` : "#"}
            className="text-sm text-gray-800 hover:bg-[#4e342e] hover:text-white border border-[#4e342e] py-1 px-4 rounded-full transition duration-300"
          >
            View Details
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
