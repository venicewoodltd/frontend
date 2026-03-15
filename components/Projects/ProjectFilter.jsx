"use client";

const ProjectFilter = ({ filters, categories, activeFilter, selectedCategory, onFilterChange, onCategoryChange }) => {
  const items = filters || categories || [];
  const selected = activeFilter || selectedCategory;
  const onChange = onFilterChange || onCategoryChange;

  return (
    <div className="flex flex-wrap gap-2 justify-center mb-6">
      {items.map((cat) => {
        const value = typeof cat === "object" ? cat.value : cat;
        const label = typeof cat === "object" ? cat.label : cat;
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`px-4 py-1.5 text-sm rounded-full border transition ${
              selected === value
                ? "bg-amber-800 text-white border-amber-800"
                : "text-amber-900 border-amber-300 hover:bg-amber-100"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default ProjectFilter;
