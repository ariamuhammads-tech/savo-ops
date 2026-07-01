import { cn } from "@/lib/utils";

/**
 * SAVO "S" monogram — stylized ribbon S with motion accents.
 * Recreated as SVG so it scales crisply and inherits `currentColor`
 * (terracotta via text-primary). Swap for the exact brand file later if needed.
 */
export function SavoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* main S */}
      <path
        d="M86 38 C86 25 68 20 53 26 C34 33 37 51 58 58 C79 65 89 71 84 85 C79 99 58 101 43 92"
        stroke="currentColor"
        strokeWidth="15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* top motion accent */}
      <path
        d="M25 31 L47 21"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinecap="round"
      />
      {/* bottom motion accent */}
      <path
        d="M31 99 L53 89"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Full SAVO logo: monogram + wordmark, in terracotta. */
export function SavoLogo({
  className,
  markClassName,
  wordClassName,
}: {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-primary", className)}>
      <SavoMark className={cn("size-7 shrink-0", markClassName)} />
      <span
        className={cn(
          "font-sans text-2xl font-extrabold tracking-tight",
          wordClassName,
        )}
      >
        SAVO
      </span>
    </span>
  );
}
