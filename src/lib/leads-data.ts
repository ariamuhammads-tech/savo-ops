export type LeadCategory =
  | "coffee_shop"
  | "cafe_bistro"
  | "bar_taphouse"
  | "coworking"
  | "resto";

export type TargetProduct = "baso_goreng" | "bitterballen_ori" | "bitterballen_cheese" | "duo_tasting";

export type LeadStatus =
  | "staged"            // Draf email siap ditinjau oleh Aria
  | "sent"              // Email sudah terkirim via thesavorium@gmail.com
  | "sample_arranged"   // Free Tasting Sample dijadwalkan / dikirim
  | "partner"           // Deal mitra aktif
  | "rejected";         // Belum tertarik

export interface StagedDraft {
  subject: string;
  body: string;
}

export interface Lead {
  id: string;
  name: string;
  category: LeadCategory;
  area: string;
  address: string;
  email: string;
  whatsapp: string;
  instagram: string;
  contactPerson: string;
  targetProduct: TargetProduct;
  status: LeadStatus;
  notes: string;
  stagedDraft: StagedDraft;
  sentAt?: string | null;
  updatedAt: string;
}

export const CATEGORY_LABELS: Record<LeadCategory, string> = {
  coffee_shop: "Specialty Coffee Shop",
  cafe_bistro: "Brunch & Bistro",
  bar_taphouse: "Bar, Taphouse & Lounge",
  coworking: "Co-working Cafe",
  resto: "Casual Eatery",
};

export const PRODUCT_LABELS: Record<TargetProduct, string> = {
  baso_goreng: "Baso Goreng SAVO (Ready-to-Fry)",
  bitterballen_ori: "Bitterballen Original (Signature Beef)",
  bitterballen_cheese: "Bitterballen Cheese (Australian Beef + Melted Cheese)",
  duo_tasting: "Curated Tasting Box (Ori + Cheese + Baso Goreng)",
};

export const STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; badgeClass: string }
> = {
  staged: {
    label: "Menunggu Persetujuan",
    badgeClass: "text-amber-700 dark:text-amber-300 border-amber-300/80 bg-amber-50 dark:bg-amber-950/40",
  },
  sent: {
    label: "Email Terkirim",
    badgeClass: "text-blue-700 dark:text-blue-300 border-blue-300/80 bg-blue-50 dark:bg-blue-950/40",
  },
  sample_arranged: {
    label: "Jadwal Tester Disepakati",
    badgeClass: "text-purple-700 dark:text-purple-300 border-purple-300/80 bg-purple-50 dark:bg-purple-950/40",
  },
  partner: {
    label: "Mitra Aktif (Deal)",
    badgeClass: "text-emerald-700 dark:text-emerald-300 border-emerald-300/80 bg-emerald-50 dark:bg-emerald-950/40",
  },
  rejected: {
    label: "Belum Tertarik",
    badgeClass: "text-zinc-600 dark:text-zinc-400 border-zinc-300/80 bg-zinc-50 dark:bg-zinc-900/40",
  },
};

export const BANDUNG_AREAS = [
  "Semua Area",
  "Riau / RE Martadinata",
  "Dago / Dipatiukur",
  "Progo / Cimanuk",
  "Braga / Asia Afrika",
  "Sukajadi / Setiabudhi",
  "Pasirkaliki / Paskal",
  "Buah Batu / Lengkong",
] as const;

// Locked B2B Prices per Aria Muhammad's ground truth:
export const SAVO_PRICING = {
  baso_goreng: {
    name: "Baso Goreng SAVO (Ready-to-Fry)",
    b2b_price_range: "Rp 35.000 – Rp 40.000 / 10 pcs",
    b2b_price_unit: 3500, // per pcs
    portion_pcs: 3,
    hpp_per_portion: 10500,
    recommended_sell_price: 28000,
    margin_percent: "62.5%",
  },
  bitterballen_ori: {
    name: "Bitterballen Original (100% Australian Beef)",
    b2b_price: 25000, // per pack (10 pcs)
    b2b_price_unit: 2500,
    portion_pcs: 5,
    hpp_per_portion: 12500,
    recommended_sell_price: 30000,
    margin_percent: "58.3%",
  },
  bitterballen_cheese: {
    name: "Bitterballen Cheese (Australian Beef + Mozzarella/Cheddar)",
    b2b_price: 35000, // per pack (10 pcs)
    b2b_price_unit: 3500,
    portion_pcs: 5,
    hpp_per_portion: 17500,
    recommended_sell_price: 38000,
    margin_percent: "53.9%",
  },
  sample_pack: {
    name: "Curated Free Tasting Sample Box",
    contents: "3 pcs Bitterballen Ori + 3 pcs Bitterballen Cheese + 2 pcs Baso Goreng + Dipping Sauce",
    cost: "Gratis untuk Kafe Prospek Baru di Bandung",
  },
};

export const INITIAL_LEADS: Lead[] = [
  {
    id: "lead-01",
    name: "Wheels Coffee Roasters",
    category: "coffee_shop",
    area: "Riau / RE Martadinata",
    address: "Jl. LLRE Martadinata No.65, Bandung",
    email: "partnership@wheelscoffee.id",
    whatsapp: "081223344551",
    instagram: "@wheelscoffeeroasters",
    contactPerson: "Tim F&B & Purchasing Wheels",
    targetProduct: "bitterballen_cheese",
    status: "staged",
    notes: "Traffic tinggi, profil pelanggan pas untuk Bitterballen Cheese & Original pendamping manual brew.",
    stagedDraft: {
      subject: "Sample Tester Bitterballen Beef untuk Menu Snack Wheels Coffee",
      body: `Halo Tim F&B Wheels Coffee Roasters, salam kenal dari Aria - SAVO Bandung.

Saya perhatikan karakter pengunjung di Wheels Coffee sangat apresiatif terhadap menu artisan berkualitas. Kami dari SAVO (produsen homemade frozen food di Bandung) ingin menawarkan suplai cemilan gurih pendamping kopi tanpa membebani operasional kitchen:

1. Bitterballen Cheese (Daging Sapi Australia 100% + lelehan keju gurih) — Rp 35.000 / pack.
2. Bitterballen Original (Rempah pala khas Belanda) — Rp 25.000 / pack.
3. Baso Goreng SAVO (Renyah mekar di luar, kopong kenyal di dalam) — Rp 35.000 / 10 pcs.

Keunggulan untuk kitchen Wheels:
• Staf bar/kitchen tinggal deep-fry 3.5 menit langsung dari beku (zero preparation time).
• HPP porsi kafe hanya ~Rp 12.500 - Rp 17.500 dengan margin laba 55% - 60%.
• Sistem beku tanpa limbah (zero food waste).

Jika berkenan, kami ingin mengantarkan 1 Curated Tasting Box (berisi 3 pcs Bitterballen Cheese, 3 pcs Ori, dan 2 pcs Baso Goreng) bebas biaya ke Wheels Coffee agar tim kitchen/barista bisa mencicipi langsung kualitasnya.

Kira-kira hari apa yang paling nyaman untuk kami antarkan tester ini?

Salam hangat,
Aria Muhammad
SAVO Bandung
thesavorium@gmail.com | 0812-2334-4551`,
    },
    updatedAt: "2026-09-08T06:00:00Z",
  },
  {
    id: "lead-02",
    name: "Sejiwa Coffee",
    category: "coffee_shop",
    area: "Progo / Cimanuk",
    address: "Jl. Progo No.15, Citarum, Bandung",
    email: "kitchen@sejiwacoffee.com",
    whatsapp: "081122334452",
    instagram: "@sejiwacoffee",
    contactPerson: "Head Kitchen / Barista Lead",
    targetProduct: "bitterballen_ori",
    status: "staged",
    notes: "Spot kopi ikonik di Progo, butuh finger food klasik daging sapi untuk teman ngobrol santai.",
    stagedDraft: {
      subject: "Penawaran Mitra Suplai Bitterballen Sapi untuk Sejiwa Progo",
      body: `Halo rekan Sejiwa Coffee Progo, salam hangat dari SAVO Bandung.

Sejiwa selalu jadi acuan standar kopi di Bandung. Menemani cangkir kopi berkualitas, kami ingin memperkenalkan Bitterballen Daging Sapi Australia 100% buatan homemade SAVO.

Formula kami dirancang khusus untuk kebutuhan kafe:
• Bitterballen Original: Rp 25.000 / pack (10 pcs).
• Bitterballen Cheese: Rp 35.000 / pack (10 pcs).
• Cukup goreng 3.5 menit, renyah di luar dan creamy gurih di dalam.
• Porsi isi 5 pcs memberikan margin kafe di atas 55% pada harga jual menu Rp 30.000 - Rp 38.000.

Kami ingin mengirimkan 1 porsi Curated Tasting Box (bebas biaya) ke Sejiwa Progo untuk dicicipi barista & kitchen lead hari ini atau besok.

Boleh kami konfirmasi waktu yang tepat untuk pengantaran sample-nya?

Salam,
Aria Muhammad
SAVO Bandung | thesavorium@gmail.com`,
    },
    updatedAt: "2026-09-08T06:10:00Z",
  },
  {
    id: "lead-03",
    name: "Beer Point / Taphouse Paskal",
    category: "bar_taphouse",
    area: "Pasirkaliki / Paskal",
    address: "Paskal Hypersquare Blok G, Bandung",
    email: "bar.beerpointbdg@gmail.com",
    whatsapp: "081299887709",
    instagram: "@taphousebdg",
    contactPerson: "Head Chef / Bar Manager",
    targetProduct: "baso_goreng",
    status: "staged",
    notes: "Bar snack paling dicari adalah baso goreng renyah dan bitterballen panas pendamping bir.",
    stagedDraft: {
      subject: "Suplai Bar Snacks: Baso Goreng Kopong & Bitterballen SAVO",
      body: `Halo Head Kitchen & Bar Manager Beer Point Paskal,

Di bar dan taproom, finger food gurih yang keluar cepat dari kitchen adalah kunci repeat order minuman.

SAVO memproduksi baso goreng dan bitterballen frozen standar bar & resto:
• Baso Goreng SAVO: Rp 35.000 / 10 pcs jumbo (digoreng mekar, kopong renyah tahan lama, sangat cocok untuk bar snack platter).
• Bitterballen Cheese: Rp 35.000 / pack (daging sapi Australia + lelehan keju).
• Waktu masak: 3-4 menit (staf bar tinggal goreng, tidak perlu persiapan adonan).
• Margin jual bar: 50% - 60% per porsi.

Kami ingin drop 1 sample box tester (gratis) ke Beer Point Paskal agar tim dapur bisa coba goreng dan cicipi bareng.

Bisa kami kirimkan sore ini sebelum jam operasional bar buka?

Terima kasih,
Aria - SAVO Bandung
thesavorium@gmail.com`,
    },
    updatedAt: "2026-09-08T06:15:00Z",
  },
  {
    id: "lead-04",
    name: "Two Hands Full",
    category: "cafe_bistro",
    area: "Sukajadi / Setiabudhi",
    address: "Jl. Sukajadi No.198A, Bandung",
    email: "hello@twohandsfull.co",
    whatsapp: "081394857103",
    instagram: "@thfcoffee",
    contactPerson: "Management Two Hands Full",
    targetProduct: "duo_tasting",
    status: "sent",
    sentAt: "2026-09-07T14:30:00Z",
    notes: "Kafe brunch spesialis Western, email penawaran tester sudah terkirim, menunggu konfirmasi jadwal antar.",
    stagedDraft: {
      subject: "Sample Tasting Bitterballen & Baso Goreng SAVO untuk Two Hands Full",
      body: `Halo Management Two Hands Full, salam dari SAVO Bandung.

Kami ingin memperkenalkan produk homemade Bitterballen Daging Sapi Australia 100% dan Baso Goreng siap saji untuk melengkapi menu brunch & coffee di THF.

Produk kami beku berkualitas, siap disajikan dalam 3-4 menit dengan margin kafe 55%+. Kami menawarkan pengiriman sample tester bebas biaya ke Sukajadi.

Salam,
Aria Muhammad
SAVO Bandung | thesavorium@gmail.com`,
    },
    updatedAt: "2026-09-07T14:30:00Z",
  },
  {
    id: "lead-05",
    name: "Jardin Cafe",
    category: "cafe_bistro",
    area: "Riau / RE Martadinata",
    address: "Jl. Cimanuk No.1A, Citarum, Bandung",
    email: "purchasing@jardincafe.id",
    whatsapp: "081827364505",
    instagram: "@jardincafe",
    contactPerson: "Supervisor Purchasing F&B",
    targetProduct: "duo_tasting",
    status: "partner",
    sentAt: "2026-09-01T10:00:00Z",
    notes: "Mitra aktif repeat order mingguan (Bitterballen Ori, Cheese & Baso Goreng).",
    stagedDraft: {
      subject: "Pembaruan Invoice & Jadwal Suplai Rutin SAVO - Jardin Cafe",
      body: `Halo Tim Purchasing Jardin Cafe, terima kasih atas repeat order rutinnya. Suplai pekan ini siap dikirimkan sesuai invoice.`,
    },
    updatedAt: "2026-09-04T16:00:00Z",
  },
];
