/**
 * Stand-in for real photography. Swap for `next/image` once trip photos
 * are available — see README.md → "Adding photos".
 */
export default function PhotoPlaceholder({
  label,
  className = "",
  variant = "swamp",
}: {
  label: string;
  className?: string;
  variant?: "swamp" | "water" | "sunset";
}) {
  const gradients: Record<string, string> = {
    swamp: "from-swamp-700 via-swamp-800 to-swamp-950",
    water: "from-water-500 via-water-600 to-swamp-950",
    sunset: "from-sunset-500 via-swamp-800 to-swamp-950",
  };

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${gradients[variant]} ${className}`}
    >
      <svg
        className="absolute inset-0 h-full w-full opacity-20"
        viewBox="0 0 200 200"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 140 Q 50 100 100 140 T 200 140 V200 H0 Z"
          fill="currentColor"
          className="text-sand-100"
        />
        <path
          d="M0 160 Q 60 130 120 160 T 200 155 V200 H0 Z"
          fill="currentColor"
          className="text-sand-100"
          opacity="0.6"
        />
      </svg>
      <span className="relative px-4 text-center font-display text-sm font-medium text-sand-100/80">
        {label}
      </span>
    </div>
  );
}
