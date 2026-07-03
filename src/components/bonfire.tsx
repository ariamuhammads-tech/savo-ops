/**
 * Decorative background: a single, realistic bonfire at the bottom-center of
 * the screen.
 *
 * Layered SVG flame tongues with vertical heat gradients (hot pale core →
 * amber → orange → terracotta tips) rise and lick from stacked, glowing logs,
 * over a warm ground glow with drifting embers. Every moving part uses cheap,
 * GPU-composited CSS transforms/opacity (no SVG filters, no per-frame noise),
 * so it stays smooth on the phones the staff use.
 *
 * Pure markup + CSS (no JS, no Math.random) → server-renderable, SSR-safe.
 * Respects `prefers-reduced-motion`. `intensity` scales overall opacity.
 */

// Deterministic ember sparks rising from the fire (no randomness → SSR-safe).
const SPARKS = Array.from({ length: 12 }, (_, i) => ({
  left: 50 + (((i * 47) % 44) - 22), // -22%..+22% around the flame axis
  size: 2 + ((i * 13) % 12) / 10, // 2.0–3.2px
  delay: ((i * 53) % 40) / 10, // 0–3.9s stagger
  duration: 2.8 + ((i * 29) % 18) / 10, // 2.8–4.5s
  drift: ((i * 31) % 40) - 20, // -20..+20px horizontal drift
  rise: 150 + ((i * 17) % 70), // 150–219px travel
}));

export function Bonfire({ intensity = 1 }: { intensity?: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 flex h-[46vh] items-end justify-center overflow-hidden"
    >
      <div
        className="relative flex items-end justify-center"
        style={{ opacity: intensity }}
      >
        {/* warm ground glow */}
        <div className="bonfire-glow absolute bottom-0 left-1/2 h-56 w-[540px] max-w-[135vw] -translate-x-1/2 rounded-full blur-3xl" />

        <svg
          width="360"
          height="300"
          viewBox="0 0 360 300"
          className="relative block max-w-[94vw] translate-y-[6%]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Vertical heat gradients — base hottest (pale), tips coolest (red). */}
            <linearGradient id="bf-outer" gradientUnits="userSpaceOnUse" x1="180" y1="52" x2="180" y2="272">
              <stop offset="0" stopColor="#a8301a" />
              <stop offset="0.32" stopColor="#e0602f" />
              <stop offset="0.66" stopColor="#f59e0b" />
              <stop offset="1" stopColor="#ffd06a" />
            </linearGradient>
            <linearGradient id="bf-mid" gradientUnits="userSpaceOnUse" x1="180" y1="86" x2="180" y2="272">
              <stop offset="0" stopColor="#e0602f" />
              <stop offset="0.4" stopColor="#f7a428" />
              <stop offset="0.78" stopColor="#ffd06a" />
              <stop offset="1" stopColor="#fff0c2" />
            </linearGradient>
            <linearGradient id="bf-inner" gradientUnits="userSpaceOnUse" x1="180" y1="128" x2="180" y2="272">
              <stop offset="0" stopColor="#f7a428" />
              <stop offset="0.5" stopColor="#ffd77a" />
              <stop offset="1" stopColor="#fff8e8" />
            </linearGradient>
            <radialGradient id="bf-embertip" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#ffcf6b" stopOpacity="0.95" />
              <stop offset="0.6" stopColor="#f59e0b" stopOpacity="0.5" />
              <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Glowing ember bed at the base of the flame (no logs). */}
          <ellipse cx="180" cy="264" rx="54" ry="12" fill="url(#bf-embertip)" />

          {/* Flames: back → front (largest/coolest → smallest/hottest). Each
              layer licks independently via a cheap CSS transform animation. */}
          <g className="flame-lick" style={{ filter: "blur(2.6px)" }}>
            <path
              fill="url(#bf-outer)"
              d="M120 272 C104 232 112 206 132 196 C138 168 132 150 150 128 C156 156 158 168 170 182 C168 140 170 96 180 52 C191 98 192 140 190 182 C202 168 205 156 210 128 C228 150 222 172 228 196 C248 206 256 232 240 272 Z"
            />
          </g>
          <g className="flame-lick l2" style={{ filter: "blur(1.6px)" }}>
            <path
              fill="url(#bf-mid)"
              d="M140 272 C128 236 134 214 150 204 C154 182 150 168 164 150 C168 172 170 182 178 194 C176 156 178 120 180 86 C183 122 184 158 182 194 C190 182 193 172 198 150 C210 168 206 186 212 204 C230 214 234 236 220 272 Z"
            />
          </g>
          <g className="flame-lick l3" style={{ filter: "blur(0.7px)" }}>
            <path
              fill="url(#bf-inner)"
              d="M162 272 C154 246 158 216 172 198 C174 170 176 150 180 122 C185 150 186 170 188 198 C202 216 206 246 198 272 Z"
            />
          </g>
        </svg>

        {/* ===== Cheap motion layers (GPU-composited) ===== */}
        {/* flickering light cast by the flame */}
        <div className="bonfire-flicker absolute bottom-8 left-1/2 h-52 w-44 -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_50%_60%_at_50%_100%,rgba(255,200,90,0.5),rgba(245,158,11,0.22)_45%,transparent_72%)] blur-xl" />

        {/* drifting embers */}
        {SPARKS.map((s, i) => (
          <span
            key={i}
            className="bonfire-spark absolute bottom-14"
            style={{
              left: `${s.left}%`,
              width: s.size,
              height: s.size,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
              ["--sx" as string]: `${s.drift}px`,
              ["--rise" as string]: `${s.rise}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
