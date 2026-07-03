/**
 * Decorative background: a single, living bonfire rising from stacked logs at
 * the bottom-center of the screen. Layered flame tongues (terracotta → orange
 * → amber → pale core) flicker asynchronously, embers drift upward, and a warm
 * ground glow breathes. Pure CSS animation — no JS, no Math.random, so SSR
 * hydration stays stable. Respects `prefers-reduced-motion`.
 */

// Deterministic ember sparks (no randomness → SSR-safe).
const SPARKS = Array.from({ length: 9 }, (_, i) => ({
  left: 50 + (((i * 53) % 44) - 22), // -22%..+22% around the flame axis
  size: 3 + ((i * 7) % 4), // 3–6px
  delay: (i * 37) % 30 / 10, // 0–2.9s
  duration: 2.6 + ((i * 41) % 16) / 10, // 2.6–4.1s
  drift: ((i * 29) % 60) - 30, // -30..+30px horizontal drift
}));

export function Bonfire({ intensity = 1 }: { intensity?: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 flex h-[46vh] items-end justify-center overflow-hidden"
    >
      <div
        className="relative h-full w-[340px] max-w-[92vw]"
        style={{ opacity: intensity }}
      >
        {/* warm ground glow */}
        <div className="bonfire-glow absolute bottom-0 left-1/2 h-64 w-[460px] max-w-[130vw] -translate-x-1/2 blur-2xl" />

        {/* embers drifting up */}
        {SPARKS.map((s, i) => (
          <span
            key={i}
            className="bonfire-spark absolute"
            style={{
              left: `${s.left}%`,
              bottom: "58px",
              width: s.size,
              height: s.size,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
              // custom prop consumed by the bonfire-spark keyframes
              ["--sx" as string]: `${s.drift}px`,
            }}
          />
        ))}

        {/* flame stack — all bottoms aligned just above the logs */}
        <span
          className="bonfire-flame outer absolute bottom-[46px] left-1/2 -translate-x-1/2"
          style={{ width: 124, height: 214, animationDuration: "1.9s" }}
        />
        <span
          className="bonfire-flame mid absolute bottom-[46px] left-1/2 -translate-x-1/2"
          style={{ width: 90, height: 172, animationDuration: "1.5s", animationDelay: "0.2s" }}
        />
        <span
          className="bonfire-flame inner absolute bottom-[46px] left-1/2 -translate-x-1/2"
          style={{ width: 60, height: 128, animationDuration: "1.2s", animationDelay: "0.35s" }}
        />
        <span
          className="bonfire-core absolute bottom-[46px] left-1/2 -translate-x-1/2"
          style={{ width: 34, height: 78 }}
        />

        {/* stacked logs at the base */}
        <div className="absolute bottom-[30px] left-1/2 -translate-x-1/2">
          <div className="bonfire-log absolute left-1/2 h-4 w-[132px] -translate-x-1/2 rotate-[14deg]" />
          <div className="bonfire-log absolute left-1/2 h-4 w-[132px] -translate-x-1/2 -rotate-[14deg]" />
        </div>
      </div>
    </div>
  );
}
