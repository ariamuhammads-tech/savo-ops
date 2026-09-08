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

export const INITIAL_LEADS: Lead[] = [];

const LEADS_STORAGE_KEY = "savo_leads_v5_clean";

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
