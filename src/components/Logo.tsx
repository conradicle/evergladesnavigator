import Image from "next/image";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/logo-icon.png"
        alt=""
        width={32}
        height={32}
        className="h-8 w-8"
        priority
      />
      <span className="font-display text-lg tracking-wide">
        Everglades Navigator
      </span>
    </span>
  );
}
