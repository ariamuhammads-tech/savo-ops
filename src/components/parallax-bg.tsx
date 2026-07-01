"use client";

import { useEffect, useRef } from "react";

/**
 * Subtle scroll-parallax background: soft warm glows that drift slower than
 * the content. Purely decorative (behind everything, non-interactive).
 * Disabled when the user prefers reduced motion.
 */
export function ParallaxBg() {
  const slow = useRef<HTMLDivElement>(null);
  const slower = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (slow.current) slow.current.style.transform = `translate3d(0,${y * 0.18}px,0)`;
        if (slower.current) slower.current.style.transform = `translate3d(0,${y * 0.34}px,0)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        ref={slow}
        className="absolute -right-[12%] -top-32 size-[460px] rounded-full bg-primary/10 blur-3xl will-change-transform"
      />
      <div
        ref={slower}
        className="absolute -bottom-40 -left-[12%] size-[420px] rounded-full bg-[color:var(--warning)]/10 blur-3xl will-change-transform"
      />
      <div className="absolute left-1/2 top-1/3 size-[320px] -translate-x-1/2 rounded-full bg-[color:var(--success)]/[0.06] blur-3xl" />
    </div>
  );
}
