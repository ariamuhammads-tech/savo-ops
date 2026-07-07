"use client";

import { useEffect, useRef } from "react";

/**
 * Animated parallax background: soft warm glows that (1) drift on their own
 * forever (ambient life), (2) move at different speeds as you scroll, and
 * (3) lean gently toward the pointer on desktop. Purely decorative, GPU
 * transforms only. Fully disabled when the user prefers reduced motion, and
 * paused while the tab is hidden to save battery.
 *
 * Composition trick: the OUTER wrapper carries the JS scroll+pointer
 * transform; the INNER `.parallax-orb` carries the CSS drift animation — so
 * the two transforms don't overwrite each other.
 */
export function ParallaxBg() {
  const orb1 = useRef<HTMLDivElement>(null);
  const orb2 = useRef<HTMLDivElement>(null);
  const orb3 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Per-orb depth: [scrollFactor, pointerFactor(px at full deflection)]
    const depths: [number, number][] = [
      [0.18, 22],
      [0.34, -30],
      [0.10, 14],
    ];
    const orbs = [orb1.current, orb2.current, orb3.current];

    // Pointer parallax only where it makes sense (mouse, not touch).
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    let scrollY = window.scrollY;
    // target vs current pointer offset (normalized -0.5..0.5), lerped for smoothness
    let px = 0;
    let py = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;
    let running = true;

    const onScroll = () => {
      scrollY = window.scrollY;
    };
    const onPointer = (e: PointerEvent) => {
      px = e.clientX / window.innerWidth - 0.5;
      py = e.clientY / window.innerHeight - 0.5;
    };

    const tick = () => {
      // ease the pointer toward its target so motion feels weighty
      cx += (px - cx) * 0.06;
      cy += (py - cy) * 0.06;
      for (let i = 0; i < orbs.length; i++) {
        const el = orbs[i];
        if (!el) continue;
        const [sf, pf] = depths[i];
        const x = finePointer ? cx * pf : 0;
        const y = scrollY * sf + (finePointer ? cy * pf : 0);
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      }
      if (running) raf = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    if (finePointer) window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div ref={orb1} className="absolute -right-[12%] -top-32 will-change-transform">
        <div className="parallax-orb a size-[460px] rounded-full bg-primary/10 blur-3xl" />
      </div>
      <div ref={orb2} className="absolute -bottom-40 -left-[12%] will-change-transform">
        <div className="parallax-orb b size-[420px] rounded-full bg-[color:var(--warning)]/10 blur-3xl" />
      </div>
      <div ref={orb3} className="absolute left-1/2 top-1/4 -translate-x-1/2 will-change-transform">
        <div className="parallax-orb c size-[340px] rounded-full bg-[color:var(--success)]/[0.06] blur-3xl" />
      </div>
    </div>
  );
}
