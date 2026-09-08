export type LeadCategory =
  | "coffee_shop"
  | "cafe_bistro"
  | "bar_taphouse"
  | "coworking"
  | "resto";

export type TargetProduct = "baso_goreng" | "bitterballen_ori" | "bitterballen_cheese" | "duo_tasting";

export type LeadStatus =
  | "staged"            // Draf email siap ditinjau oleh Aria
  | "sent"              // Email sudah terkirim via thesavorium@gmail.com (menunggu respon)
  | "replied_email"     // Dibalas via Email
  | "replied_whatsapp"  // Dibalas via WhatsApp / IG
  | "sample_arranged"   // Free Tasting Sample dijadwalkan / dikirim
  | "partner"           // Deal mitra aktif
  | "rejected";         // Belum tertarik / Arsip Dingin

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
  replied_email: {
    label: "Balas via Email",
    badgeClass: "text-emerald-700 dark:text-emerald-300 border-emerald-300/80 bg-emerald-50 dark:bg-emerald-950/40 font-semibold",
  },
  replied_whatsapp: {
    label: "Balas via WA/IG",
    badgeClass: "text-emerald-700 dark:text-emerald-300 border-emerald-300/80 bg-emerald-50 dark:bg-emerald-950/40 font-semibold",
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
    label: "Belum Tertarik / Arsip",
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

export interface LeadAgingNotice {
  ageDays: number;
  statusCategory: "waiting" | "needs_followup" | "cold";
  label: string;
  badgeClass: string;
  isActionRequired: boolean;
}

export function getLeadAgingNotice(lead: Lead): LeadAgingNotice | null {
  if (lead.status !== "sent" || !lead.sentAt) return null;
  const sentDate = new Date(lead.sentAt).getTime();
  if (isNaN(sentDate)) return null;
  const now = Date.now();
  const diffMs = Math.max(0, now - sentDate);
  const ageDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (ageDays < 4) {
    return {
      ageDays,
      statusCategory: "waiting",
      label: ageDays === 0 ? "Terkirim Hari Ini" : `Menunggu (${ageDays} hari)`,
      badgeClass: "text-blue-700 dark:text-blue-300 border-blue-300/80 bg-blue-50 dark:bg-blue-950/40",
      isActionRequired: false,
    };
  } else if (ageDays <= 7) {
    return {
      ageDays,
      statusCategory: "needs_followup",
      label: `⚠️ Hening ${ageDays} Hari (Perlu Follow-up)`,
      badgeClass: "text-amber-800 dark:text-amber-200 border-amber-400/90 bg-amber-100/90 dark:bg-amber-950/80 font-bold",
      isActionRequired: true,
    };
  } else {
    return {
      ageDays,
      statusCategory: "cold",
      label: `❄️ Hening ${ageDays} Hari (Dingin / Arsip)`,
      badgeClass: "text-zinc-600 dark:text-zinc-400 border-zinc-300 bg-zinc-100 dark:bg-zinc-800/60",
      isActionRequired: false,
    };
  }
}

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
      subject: "Peluang kerja sama menu camilan untuk Wheels Coffee Roasters",
      body: `Halo tim Wheels Coffee, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi dan baso goreng beku siap goreng khusus untuk kebutuhan kafe.

Saya menghubungi rekan-rekan untuk menjajaki peluang kerja sama penyediaan menu camilan pendamping kopi di Wheels Coffee.

Produk kami berbentuk siap goreng (zero prep), sehingga tim bar atau dapur cukup menggorengnya 3–4 menit tanpa perlu persiapan bahan mentah.

Jika tim Wheels Coffee berkenan, kami dengan senang hati mengirimkan sampel tester cuma-cuma untuk dicicipi langsung oleh tim dapur atau barista.

Terima kasih banyak atas perhatian dan waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
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
      subject: "Peluang suplai camilan bitterballen & baso goreng untuk Sejiwa Progo",
      body: `Halo rekan-rekan Sejiwa Coffee, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi dan baso goreng beku siap goreng untuk kebutuhan kafe lokal.

Saya menghubungi tim Sejiwa untuk memperkenalkan produk kami, barangkali pas untuk melengkapi variasi menu camilan hangat di Progo.

Produk kami berbentuk siap goreng (zero prep), jadi praktis disajikan dalam 3–4 menit tanpa menyita waktu barista atau dapur.

Jika rekan-rekan berkenan, kami ingin mengirimkan tester sampel cuma-cuma untuk dicoba langsung oleh tim Sejiwa.

Terima kasih banyak atas perhatian dan waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
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
      subject: "Opsi suplai bar snack untuk Beer Point Paskal",
      body: `Halo tim Beer Point Paskal, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi baso goreng dan bitterballen daging sapi beku siap saji khusus untuk pendamping minuman.

Saya menghubungi rekan-rekan untuk menjajaki peluang suplai bar snack renyah dan gurih di Beer Point.

Produk kami siap goreng dalam 4 menit tanpa proses persiapan bahan mentah, sehingga sangat efisien untuk operasional kitchen bar saat jam sibuk.

Jika tim Beer Point berkenan, kami dengan senang hati mengirimkan paket tester cuma-cuma untuk dicoba oleh tim kitchen.

Terima kasih banyak atas waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
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
      subject: "Peluang kerja sama menu camilan untuk Two Hands Full",
      body: `Halo tim Two Hands Full, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi Australia dan baso goreng siap saji untuk mitra kafe.

Saya menghubungi rekan-rekan untuk menjajaki kerja sama penyediaan finger food pendamping kopi dan brunch di Two Hands Full.

Produk kami zero-prep (siap goreng 3–4 menit) dengan tekstur renyah di luar dan lumer di dalam, menjaga efisiensi kitchen tetap optimal.

Jika rekan-rekan berkenan, saya ingin mengirimkan sampel tester untuk dicicipi oleh tim dapur atau management.

Terima kasih banyak atas perhatian dan waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
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
  {
    id: "lead-06",
    name: "Kiputih Satu Bake & Dine",
    category: "cafe_bistro",
    area: "Dago / Dipatiukur",
    address: "Jl. Kiputih No. 1, Ciumbuleuit, Bandung",
    email: "partnership@kiputihsatu.id",
    whatsapp: "08123490812",
    instagram: "@kiputihsatu",
    contactPerson: "Head Chef & Purchasing Kiputih",
    targetProduct: "bitterballen_ori",
    status: "sent",
    sentAt: "2026-09-04T09:00:00Z",
    notes: "Email tester terkirim 4 hari lalu, belum ada konfirmasi penerimaan sample.",
    stagedDraft: {
      subject: "Peluang kerja sama menu camilan untuk Kiputih Satu",
      body: `Halo rekan-rekan Kiputih Satu, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi klasik dan baso goreng beku siap goreng khusus untuk kafe.

Saya menghubungi tim Kiputih Satu untuk memperkenalkan camilan kami, siapa tahu dapat menjadi opsi tambahan menu santai di sana.

Produk kami dirancang siap goreng dalam hitungan menit tanpa ribet persiapan adonan di kitchen.

Jika rekan-rekan berkenan, kami sangat terbuka untuk mengirimkan sampel tester cuma-cuma agar bisa dicicipi langsung oleh tim.

Terima kasih banyak atas perhatian dan waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
    },
    updatedAt: "2026-09-04T09:00:00Z",
  },
];

const LEADS_STORAGE_KEY = "savo_leads_v4";

export function getStoredLeads(): Lead[] {
  if (typeof window === "undefined") return INITIAL_LEADS;
  try {
    const raw = localStorage.getItem(LEADS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(INITIAL_LEADS));
      return INITIAL_LEADS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_LEADS;
  } catch {
    return INITIAL_LEADS;
  }
}

export function saveStoredLeads(leads: Lead[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
    window.dispatchEvent(new Event("savo_leads_updated"));
  } catch (err) {
    console.error("[Leads Store] Gagal menyimpan leads:", err);
  }
}

export function updateStoredLeadStatus(id: string, status: LeadStatus, extra?: Partial<Lead>): Lead[] {
  const current = getStoredLeads();
  const updated = current.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        status,
        ...extra,
        updatedAt: new Date().toISOString(),
      };
    }
    return item;
  });
  saveStoredLeads(updated);
  return updated;
}

export function resetStoredLeads(): Lead[] {
  if (typeof window === "undefined") return INITIAL_LEADS;
  try {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(INITIAL_LEADS));
    window.dispatchEvent(new Event("savo_leads_updated"));
  } catch (err) {
    console.error("[Leads Store] Gagal reset leads:", err);
  }
  return INITIAL_LEADS;
}
