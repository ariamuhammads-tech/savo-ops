/**
 * Decorative stove-flame background: a row of flickering flame tongues
 * rising from the bottom edge (amber core → orange → terracotta, with a
 * faint gas-blue base). Pure CSS animation — no JS. Sits behind content,
 * non-interactive; disabled via prefers-reduced-motion in globals.css.
 */
export function StoveFlames({ intensity = 1 }: { intensity?: number }) {
  // [width, height, left%, delay, duration]
  const flames: [number, number, number, number, number][] = [
    [70, 120, 6, 0.0, 1.9],
    [90, 170, 16, 0.5, 1.6],
    [60, 110, 27, 0.2, 2.1],
    [110, 210, 38, 0.8, 1.5],
    [80, 150, 52, 0.3, 1.8],
    [120, 230, 63, 0.6, 1.4],
    [65, 120, 77, 0.1, 2.0],
    [95, 180, 87, 0.7, 1.7],
  ];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-[45vh] overflow-hidden"
      style={{ opacity: 0.5 * intensity }}
    >
      {/* warm ember glow along the bottom */}
      <div className="savo-ember absolute inset-x-0 -bottom-24 h-56 blur-3xl" />

      {/* gas-blue base line, like a stove burner */}
      <div className="savo-gasline absolute inset-x-[8%] -bottom-3 h-10 blur-xl" />

      {/* flame tongues */}
      {flames.map(([w, h, left, delay, dur], i) => (
        <span
          key={i}
          className="savo-flame absolute bottom-[-18px]"
          style={{
            width: w,
            height: h,
            left: `${left}%`,
            animationDelay: `${delay}s`,
            animationDuration: `${dur}s`,
          }}
        />
      ))}
    </div>
  );
}
