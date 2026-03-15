"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const TestimonialCard = ({ testimonial, initials, delay }) => {
  const { author, content, rating, image } = testimonial;

  return (
    <div
      className="bg-white p-8 rounded-xl shadow-2xl border border-[#d7ccc8] border-t-4 border-t-[#4e342e] hover:shadow-lg transition duration-300"
      style={{ transitionDelay: delay }}
    >
      {rating && (
        <div className="flex gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className={
                i < rating ? "text-yellow-500 text-lg" : "text-gray-300 text-lg"
              }
            >
              ★
            </span>
          ))}
        </div>
      )}
      <p className="text-lg italic text-gray-800 mb-6 leading-relaxed">
        &ldquo;{content}&rdquo;
      </p>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#4e342e] flex items-center justify-center text-white font-bold text-sm shrink-0">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-[#3e2723]">{author}</p>
          <p className="text-xs text-gray-500">Verified Client</p>
        </div>
      </div>
      {image && (
        <div className="mt-4 pt-4 border-t border-[#d7ccc8]">
          <img
            src={`${API_URL}/api/images/${image}`}
            alt={author}
            className="w-full h-32 object-cover rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

export default TestimonialCard;
