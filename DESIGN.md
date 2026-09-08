# Design System & Visual Specification: SAVO Ops

## 1. Brand Philosophy & Aesthetic Direction

- **Core Aesthetic:** Swiss International Style + Apple Human Interface Guidelines (HIG) + Boutique F&B Artisan Wholesale.
- **Visual Personality:** Quiet Confidence, Restraint, Precision, Tactile Cleanliness, Zero Slop.
- **Anti-Container Laziness Law:** Dilarang keras membungkus elemen secara serampangan ke dalam *card containers*, *bento boxes*, atau kotak ber-radius/border sebagai kruk spasial. Tata letak dibangun dari kontras skala modular tipografi, *whitespace* murni, dan *monoline technical datum lines* (hairline 1px).
- **Zero Primitive Hacks:** Dilarang menggunakan gradien cahaya tiruan, bayangan 2D buram berlebih, atau elemen dekoratif animasi api palsu.
- **Color Identity:**
  - Background: Warm Bone / Ecru Paper (`#FBF8F4` Light / `#17120E` Dark)
  - Ink Foreground: Deep Espresso (`#1A1714` Light / `#F2EAE1` Dark)
  - Brand Accent: SAVO Savory Terracotta (`#C0492B` Light / `#E0603C` Dark)
  - Structural Datum: Technical Warm Hairline (`#EAE0D8` Light / `#362E26` Dark)
  - Muted Text: Warm Secondary Stone (`#756258` Light / `#A79A8C` Dark)

---

## 2. Design Tokens (Machine-Readable YAML)

```yaml
tokens:
  colors:
    primary:
      light: "#C0492B"
      dark: "#E0603C"
      foreground: "#FFF8F4"
    background:
      light: "#FBF8F4"
      dark: "#17120E"
    surface:
      light: "#FFFFFF"
      dark: "#201A15"
    surface_container_low:
      light: "#F4EFE9"
      dark: "#2A231D"
    text:
      primary:
        light: "#1A1714"
        dark: "#F2EAE1"
      secondary:
        light: "#756258"
        dark: "#A79A8C"
      muted:
        light: "#948479"
        dark: "#84776C"
    border:
      hairline:
        light: "#EAE0D8"
        dark: "#362E26"
      active:
        light: "#C0492B"
        dark: "#E0603C"
    status:
      success:
        bg_light: "#ECFDF5"
        text_light: "#065F46"
        border_light: "#A7F3D0"
        bg_dark: "#064E3B"
        text_dark: "#6EE7B7"
        border_dark: "#047857"
      warning:
        bg_light: "#FFFBEB"
        text_light: "#92400E"
        border_light: "#FDE68A"
        bg_dark: "#78350F"
        text_dark: "#FCD34D"
        border_dark: "#B45309"
      error:
        bg_light: "#FEF2F2"
        text_light: "#991B1B"
        border_light: "#FECACA"
        bg_dark: "#7F1D1D"
        text_dark: "#FCA5A5"
        border_dark: "#DC2626"
      neutral:
        bg_light: "#F4EFE9"
        text_light: "#574A43"
        border_light: "#E5DDD5"
        bg_dark: "#26201B"
        text_dark: "#B5A79E"
        border_dark: "#3D342D"

  typography:
    font_families:
      display: "'Oriya MN', 'OriyaMN-Bold', -apple-system, sans-serif"
      sans: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif"
      mono: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace"
    scale:
      xs: "11px"
      sm: "12px"
      base: "14px"
      md: "15px"
      lg: "17px"
      xl: "20px"
      "2xl": "24px"
      "3xl": "30px"
      "4xl": "36px"
    line_height:
      tight: 1.2
      snug: 1.35
      normal: 1.5
      relaxed: 1.65

  spacing:
    unit: "8px"
    scale: [0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96]

  radii:
    none: "0px"
    xs: "4px"
    sm: "6px"
    md: "10px"
    lg: "14px"
    full: "9999px"

  shadows:
    xs: "0 1px 2px rgba(26, 23, 20, 0.04)"
    card: "0 1px 3px rgba(26, 23, 20, 0.05), 0 1px 2px rgba(26, 23, 20, 0.03)"
    card_hover: "0 4px 14px -2px rgba(26, 23, 20, 0.08)"
    popover: "0 12px 32px -4px rgba(26, 23, 20, 0.14)"

  motion:
    spring: "cubic-bezier(0.16, 1, 0.3, 1)"
    duration_fast: "150ms"
    duration_normal: "240ms"
    duration_slow: "360ms"
```

---

## 3. Apple HIG Ergonomics & Accessibility Compliance

1. **Click & Touch Targets:**
   - Desktop standard click target: minimal $\ge 28\text{px}$, optimal $32\text{px} - 38\text{px}$.
   - Mobile touch target: minimal $\ge 44\text{pt}$ ($44\text{px} - 52\text{px}$).
   - Jarak antar-tombol minimal $8\text{px}$ untuk mencegah salah tekan (*fat-finger prevention*).
2. **Color Contrast (WCAG 2.1 AA/AAA):**
   - Teks utama (`#1A1714` pada `#FBF8F4`) memiliki rasio kontras $> 14:1$ (lulus WCAG AAA).
   - Teks sekunder/muted (`#756258` pada `#FBF8F4`) memiliki rasio kontras $\ge 4.8:1$ (lulus WCAG AA).
   - Indikator status (amber, emerald, red) wajib disertai teks atau ikon pendamping, tidak hanya warna semata.
3. **Platform Conventions:**
   - **Desktop:** Sidebar vertikal monoline kiri ($256\text{px}$ lebar tetap, ketinggian baris item $38\text{px}$, ikon $16\text{px}$).
   - **Mobile:** Bottom navigation bar 5 tab tetap di bagian bawah dengan `env(safe-area-inset-bottom)` dan ketinggian $52\text{px}$.
4. **Editorial Hierarchy:**
   - Nomor metrik modular menggunakan Display font dengan bobot tegas (`font-bold`).
   - Metadata teknis (kode lead, tanggal, harga grosir satuan) selalu menggunakan monospaced font berukuran $10\text{px} - 11\text{px}$.
   - Teks antarmuka menggunakan *sentence case* (bukan ALLCAPS di seluruh kalimat).

---

## 4. Component Rules

- **Primary Action Button:** Background solid `bg-foreground text-background`, sudut `rounded-lg`, elevasi mikro Apple HIG, responsif saat hover/active (`hover:opacity-90 active:scale-[0.99]`).
- **Secondary Action Button:** Background `bg-card border border-border text-foreground`, sudut `rounded-lg`, hover `hover:bg-secondary`.
- **Segmented Controls (Hades Copilot):** Wadah `bg-secondary/70 p-0.5 rounded-lg border border-border`, tombol aktif `bg-card text-foreground font-semibold shadow-xs`.
- **Swiss Monoline Metric Shelf:** Deretan metrik tanpa kotak individual terisolasi, dipisahkan oleh garis batas monoline teknis 1px (`divide-x divide-border`).
- **Data Tables / Lists:** Baris data lapang dengan padding vertikal $12\text{px} - 16\text{px}$, pemisah `border-b border-border/80`, dan status badge yang tegas.
