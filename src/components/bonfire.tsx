/**
 * Decorative background: a single fire at the bottom-center of the screen,
 * redrawn from the owner's hand-inked flame illustration — a tall curving
 * central tongue, layered side licks, small detached wisps, and tufts that
 * sweep outward at the base. Colored with vertical heat gradients (hot pale
 * core → amber → orange → terracotta tips) and overlaid with light "ink
 * stroke" lines to keep the hand-drawn character.
 *
 * Every moving part uses cheap, GPU-composited CSS transforms/opacity (no SVG
 * filters, no per-frame noise), so it stays smooth on the phones the staff
 * use. Pure markup + CSS (no JS, no Math.random) → server-renderable,
 * SSR-safe. Respects `prefers-reduced-motion`. `intensity` scales opacity.
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
            <linearGradient id="bf-outer" gradientUnits="userSpaceOnUse" x1="180" y1="44" x2="180" y2="276">
              <stop offset="0" stopColor="#a8301a" />
              <stop offset="0.32" stopColor="#e0602f" />
              <stop offset="0.66" stopColor="#f59e0b" />
              <stop offset="1" stopColor="#ffd06a" />
            </linearGradient>
            <linearGradient id="bf-mid" gradientUnits="userSpaceOnUse" x1="180" y1="84" x2="180" y2="274">
              <stop offset="0" stopColor="#e0602f" />
              <stop offset="0.4" stopColor="#f7a428" />
              <stop offset="0.78" stopColor="#ffd06a" />
              <stop offset="1" stopColor="#fff0c2" />
            </linearGradient>
            <linearGradient id="bf-inner" gradientUnits="userSpaceOnUse" x1="180" y1="122" x2="180" y2="274">
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

          {/* Glowing ember bed at the base of the flame. */}
          <ellipse cx="180" cy="266" rx="60" ry="12" fill="url(#bf-embertip)" />

          {/* ===== Outer flame — full silhouette from the illustration:
                 tufted base, stacked side licks, tall curving central tip. */}
          <g className="flame-lick" style={{ filter: "blur(2.4px)" }}>
            <path
              fill="url(#bf-outer)"
              d="M92 268
                 C104 262 112 258 118 250
                 C102 236 100 214 114 200
                 C104 184 108 162 124 150
                 C122 166 128 176 138 182
                 C134 150 140 124 158 108
                 C156 132 160 148 170 158
                 C166 116 174 72 194 44
                 C200 84 198 124 190 158
                 C200 146 208 130 210 110
                 C222 130 222 156 214 172
                 C226 164 234 150 238 134
                 C248 158 244 182 234 196
                 C246 192 254 184 258 172
                 C266 198 258 222 246 234
                 C258 240 264 250 270 256
                 C256 264 240 268 224 270
                 C208 274 190 276 180 276
                 C156 276 116 274 92 268 Z"
            />
            {/* small detached wisps, like the stray licks in the drawing */}
            <path
              fill="url(#bf-outer)"
              opacity="0.85"
              d="M86 196 C80 180 84 162 96 150 C92 166 96 180 103 190 C97 197 90 199 86 196 Z"
            />
            <path
              fill="url(#bf-outer)"
              opacity="0.85"
              d="M266 152 C272 138 270 124 262 112 C272 122 280 138 277 154 C273 160 268 158 266 152 Z"
            />
          </g>

          {/* ===== Mid flame ===== */}
          <g className="flame-lick l2" style={{ filter: "blur(1.5px)" }}>
            <path
              fill="url(#bf-mid)"
              d="M126 272
                 C116 256 118 238 132 226
                 C124 208 130 188 144 176
                 C142 190 146 200 154 206
                 C150 178 156 152 170 134
                 C170 158 172 172 178 182
                 C176 148 180 110 188 84
                 C194 118 192 152 186 182
                 C194 170 200 156 202 140
                 C212 158 210 182 202 198
                 C212 190 218 180 222 168
                 C230 190 224 214 212 226
                 C224 234 226 248 218 260
                 C204 270 190 272 180 272
                 C162 274 140 274 126 272 Z"
            />
          </g>

          {/* ===== Inner bright core ===== */}
          <g className="flame-lick l3" style={{ filter: "blur(0.7px)" }}>
            <path
              fill="url(#bf-inner)"
              d="M154 272
                 C146 254 148 234 160 218
                 C158 196 162 176 172 160
                 C172 178 174 190 178 198
                 C176 172 178 144 182 122
                 C186 148 186 176 184 198
                 C190 188 194 176 196 164
                 C204 182 202 206 194 222
                 C202 236 200 254 192 268
                 C184 272 166 272 154 272 Z"
            />
          </g>

          {/* ===== Ink-stroke detail lines — the hand-drawn character of the
                 original illustration, tinted warm and riding the outer layer's
                 flicker. */}
          <g
            className="flame-lick"
            stroke="#8a2a12"
            strokeWidth="1.3"
            strokeLinecap="round"
            opacity="0.28"
            fill="none"
          >
            <path d="M150 252 C142 230 152 208 148 188 C146 176 152 168 160 160" />
            <path d="M180 258 C172 226 186 196 178 168 C174 152 182 136 190 122" />
            <path d="M204 248 C212 224 202 200 208 178 C212 164 206 152 200 144" />
            <path d="M134 238 C126 218 136 202 132 186" />
            <path d="M224 234 C234 214 226 196 230 180" />
            <path d="M166 244 C160 222 170 206 166 190" />
            <path d="M192 244 C198 222 192 204 196 188" />
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
