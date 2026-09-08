# Design System & Visual Specification: SAVO Ops (Pakem AURA)

## 1. Brand Philosophy & Aesthetic Direction

- **Core Aesthetic:** Modern Japanese Minimalism (*Wa-Modern*, *Ma* - intentional negative space) merged with High-Tech Minimalist Digital Architecture (Reference Benchmark: *Aura corporate website* by UPROCK.DESIGN / Arslan Usmanov).
- **Visual Personality:** Quiet Mastery, Pristine Cleanliness, Mathematical Precision, Expansive Whitespace, Zero Slop.
- **Anti-Container Laziness Law (Larangan "Sange Kotak"):**
  - Dilarang keras membungkus teks, metrik, tabel, atau form ke dalam kotak ber-radius/border bertumpuk (*card-inside-card* / *bento boxes*) sebagai kruk menutupi ketidakmampuan mengolah ruang negatif.
  - Tata letak dibangun murni dari kontras tipografi, kelegaan kanvas putih (*pure white expanse*), dan garis datum teknis monoline 1px (*hairline* `#E5E6EB`).
- **Zero Primitive Hacks:**
  - Dilarang menggunakan gradien cahaya tiruan, bayangan 2D buram berlebih, atau elemen animasi api/gas palsu.
- **Color Identity (AURA Standard):**
  - **Canvas Background:** Pure Pristine White (`#FFFFFF` Light / `#0A0A0B` Dark Obsidian)
  - **Surfaces:** Clean Light Grays (`#F7F7F8`, `#FAFAFA` Light / `#141416`, `#18181B` Dark)
  - **Inks:**
    - Primary Ink: Deep Carbon Black (`#0A0A0B` Light / `#F8FAFC` Dark)
    - Secondary Ink: Refined Graphite (`#4A4D57` Light / `#A1A1AA` Dark)
    - Muted Ink: Technical Cool Gray (`#8E92A0` Light / `#71717A` Dark)
  - **Brand Accent:** SAVO Terracotta (`#C0492B` Light / `#E0603C` Dark)
  - **Structural Hairline:** Ultra-Sharp 1px Monoline (`#E5E6EB` Light / `#232326` Dark)

---

## 2. Design Tokens (Machine-Readable YAML)

```yaml
tokens:
  colors:
    background:
      light: "#FFFFFF"
      dark: "#0A0A0B"
    surface:
      light: "#F7F7F8"
      dark: "#141416"
    surface_subtle:
      light: "#FAFAFA"
      dark: "#18181B"
    border_hairline:
      light: "#E5E6EB"
      dark: "#232326"
    text:
      primary:
        light: "#0A0A0B"
        dark: "#F8FAFC"
      secondary:
        light: "#4A4D57"
        dark: "#A1A1AA"
      muted:
        light: "#8E92A0"
        dark: "#71717A"
    brand:
      terracotta:
        light: "#C0492B"
        dark: "#E0603C"
        foreground: "#FFFFFF"
    status:
      success:
        light: "#15803D"
        dark: "#22C55E"
        bg_light: "#F0FDF4"
      warning:
        light: "#B45309"
        dark: "#F59E0B"
        bg_light: "#FFFBEB"
      destructive:
        light: "#D32F2F"
        dark: "#EF4444"
        bg_light: "#FEF2F2"

  typography:
    font_families:
      display: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
      sans: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
      mono: "'JetBrains Mono', 'SF Mono', monospace"
    scale:
      xs: "11px"
      sm: "12px"
      base: "13.5px"
      md: "15px"
      lg: "18px"
      xl: "22px"
      "2xl": "26px"
      "3xl": "32px"
      "4xl": "40px"

  spacing_and_layout:
    top_meta_bar_height: "56px"
    max_content_width: "1440px"
    content_padding_desktop: "36px 48px"
    content_padding_mobile: "20px"
```

---

## 3. Aura Component Hierarchy

1. **Top Minimalist Meta Bar (Sticky):**
   - Menggantikan sidebar tradisional yang memotong layar.
   - Menyajikan identitas brand mono, navigasi horizontal teks murni dengan active underline indicator, status server real-time (`● ONLINE`), dan kontrol tema.

2. **Hero Expanse Centerpiece:**
   - Menghadirkan *white space* terbuka yang megah.
   - Menampilkan logo resmi SAVO yang mengambang dengan bayangan optik mikro (`drop-shadow(0 8px 24px rgba(0,0,0,0.06))`).
   - Dilengkapi metadata teknis kiri & kanan serta dynamic companion pill.

3. **Principle Divider Strip:**
   - Garis penopang monoline 1px teknis yang memuat doktrin operasional B2B resmi SAVO.

4. **Compact Standards Ribbon (Pipeline Metrik):**
   - 6 ubin metrik minimalis tanpa border tebal rounded-xl bertumpuk. Angka bold 32px dengan label mono uppercase.

5. **Aura Section Blocks (Zero Card Wrapping):**
   - Setiap seksi dibuka dengan monoline border-top 1px, nomor indeks mono (`01 // MEJA PERSETUJUAN DRAF EMAIL`), headline kontras tinggi, dan paragraf lead terbuka.
   - Daftar antrean dan data disajikan dalam flat hairline rows atau full-width `.aura-table`.
