"use client";

const MissionPillar = ({ pillar }) => {
  const { title, description, icon, delay } = pillar;

  return (
    <div
      className="p-6 text-center rounded-xl shadow-xl border-t-4 border-amber-900/70 bg-amber-50"
      style={{ transitionDelay: delay }}
    >
      {icon}
      <h3 className="text-2xl font-serif font-bold text-gray-800 mb-3">
        {title}
      </h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default MissionPillar;
