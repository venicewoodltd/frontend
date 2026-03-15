"use client";

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  className?: string;
}

export default function CircularProgress({
  progress,
  size = 60,
  strokeWidth = 6,
  showPercentage = true,
  className = "",
}: CircularProgressProps) {
  const validProgress = isNaN(progress)
    ? 0
    : Math.max(0, Math.min(100, progress));

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (validProgress / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#4e342e"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-300 ease-out"
        />
      </svg>
      {showPercentage && (
        <span className="absolute text-xs font-semibold text-[#4e342e]">
          {Math.round(validProgress)}%
        </span>
      )}
    </div>
  );
}

export function InlineProgress({
  progress,
  label,
}: {
  progress: number;
  label?: string;
}) {
  return (
    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-lg">
      <CircularProgress progress={progress} size={50} strokeWidth={4} />
      {label && (
        <span className="text-white text-xs mt-2 font-medium">{label}</span>
      )}
    </div>
  );
}
