import Image from "next/image";

export default function Logo({
  className = "",
  textClassName = "text-lg",
}: {
  className?: string;
  textClassName?: string;
}) {
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
      {/* Inner span keeps nowrap even when textClassName resets white-space (e.g. not-sr-only). */}
      <span className={`font-display tracking-wide ${textClassName}`}>
        <span className="whitespace-nowrap">Everglades Navigator</span>
      </span>
    </span>
  );
}
