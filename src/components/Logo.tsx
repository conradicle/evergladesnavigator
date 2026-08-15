/**
 * Placeholder wordmark. Once a real logo file is dropped into `public/`
 * (e.g. `public/logo.svg`), swap this out for an `<Image src="/logo.svg" ... />`.
 * See README.md → "Adding the real logo".
 */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="2" />
        <path
          d="M20 6 L24 20 L20 34 L16 20 Z"
          fill="currentColor"
          opacity="0.9"
        />
        <circle cx="20" cy="20" r="2.5" fill="var(--color-sunset-500)" />
      </svg>
      <span className="font-display text-lg tracking-wide">
        Everglades Navigator
      </span>
    </span>
  );
}
