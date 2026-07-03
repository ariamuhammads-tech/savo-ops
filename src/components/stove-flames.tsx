/**
 * Decorative stove-flame background: an even row of flickering flame tongues
 * rising from the bottom edge (amber core → orange → terracotta, with a
 * faint gas-blue base), like a stove burner. Pure CSS animation — no JS.
 * Deterministic sizes/delays (no Math.random) to keep SSR hydration stable.
 */
const COUNT = 14;

const FLAMES = Array.from({ length: COUNT }, (_, i) => ({
  // even spacing across the full width, slight breathing room at the edges
  left: 1.5 + (i * 97) / COUNT,
  width: 72 + ((i * 37) % 18), // 72–89px — near-uniform
  height: 140 + ((i * 53) % 30), // 140–169px — near-uniform
  delay: ((i * 29) % 12) / 10, // 0–1.1s staggered
  duration: 1.5 + ((i * 41) % 5) / 10, // 1.5–1.9s
}));

export function StoveFlames({ intensity = 1 }: { intensity?: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-[45vh] overflow-hidden"
      style={{ opacity: 0.5 * intensity }}
    >
      {/* warm ember glow along the bottom */}
      <div className="savo-ember absolute inset-x-0 -bottom-24 h-56 blur-3xl" />

      {/* gas-blue base line, like a stove burner */}
      <div className="savo-gasline absolute inset-x-[4%] -bottom-3 h-10 blur-xl" />

      {/* flame tongues — even burner row */}
      {FLAMES.map((f, i) => (
        <span
          key={i}
          className="savo-flame absolute bottom-[-18px]"
          style={{
            width: f.width,
            height: f.height,
            left: `${f.left}%`,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
