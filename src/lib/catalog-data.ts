export interface CatalogItem {
  id: string;
  name: string;
  categoryTag: string;
  b2bPrice: number;
  packUnit: string;
  description: string;
  portionDesc: string;
  hppPerPortion: number;
  recommendedSellPrice: number;
  marginPercent: string;
  cookTime: string;
  imageUrl?: string | null;
  imageName?: string | null;
  imageSizeKb?: number | null;
}

export const DEFAULT_CATALOG: CatalogItem[] = [
  {
    id: "bitterballen_ori",
    name: "Bitterballen Original (100% Australian Beef)",
    categoryTag: "SIGNATURE FINGER FOOD",
    b2bPrice: 25000,
    packUnit: "/ pack (10 pcs)",
    description:
      "Kroket daging sapi khas Belanda dengan isian 100% Australian Beef bertekstur ragout creamy gurih dan aroma rempah pala asli. Sangat disukai sebagai pendamping kopi di kafe artisan.",
    portionDesc: "Porsi Kafe (5 pcs)",
    hppPerPortion: 12500,
    recommendedSellPrice: 30000,
    marginPercent: "58.3%",
    cookTime: "3.5 Menit (170°C)",
    imageUrl: null,
  },
  {
    id: "bitterballen_cheese",
    name: "Bitterballen Cheese (Australian Beef + Mozzarella)",
    categoryTag: "PREMIUM VARIANT",
    b2bPrice: 35000,
    packUnit: "/ pack (10 pcs)",
    description:
      "Varian favorit generasi muda: perpaduan daging sapi Australia dengan lelehan keju mozarella/cheddar gurih di setiap gigitan. Sempurna untuk kafe brunch dan beer house.",
    portionDesc: "Porsi Kafe (5 pcs)",
    hppPerPortion: 17500,
    recommendedSellPrice: 38000,
    marginPercent: "53.9%",
    cookTime: "3.5 Menit (170°C)",
    imageUrl: null,
  },
  {
    id: "baso_goreng",
    name: "Baso Goreng SAVO (Ready-to-Fry)",
    categoryTag: "HIGH-VOLUME CROWD PLEASER",
    b2bPrice: 35000,
    packUnit: "/ 10 pcs (Rp 35k - Rp 40k)",
    description:
      "Baso goreng homemade siap goreng dengan tekstur garing mekar di luar, kopong kenyal di dalam, serta rasa gurih umami asli. Disukai semua kalangan, cocok untuk bar snack dan nongkrong malam.",
    portionDesc: "Porsi Kafe (3 pcs potong)",
    hppPerPortion: 10500,
    recommendedSellPrice: 28000,
    marginPercent: "62.5%",
    cookTime: "4 Menit (160°C)",
    imageUrl: null,
  },
  {
    id: "sample_pack",
    name: "Curated Free Tasting Sample Box",
    categoryTag: "STRATEGI AKUISISI // ZERO FRICTION",
    b2bPrice: 0,
    packUnit: "Gratis untuk Mitra Baru",
    description:
      "Porsi kurasi sampel tester: 3 pcs Bitterballen Ori + 3 pcs Bitterballen Cheese + 2 pcs Baso Goreng + Dipping Sauce. Ringkas dan hemat operasional bagi Savo Eats, namun membuktikan kualitas rasa secara langsung ke barista dan chef kafe.",
    portionDesc: "1 Sample Box Lengkap",
    hppPerPortion: 15000,
    recommendedSellPrice: 0,
    marginPercent: "Tester Gratis",
    cookTime: "Siap Cicip Bersama",
    imageUrl: null,
  },
];

export const CATALOG_STORAGE_KEY = "savo_catalog_v2";

export function getStoredCatalog(): CatalogItem[] {
  if (typeof window === "undefined") return DEFAULT_CATALOG;
  try {
    const raw = localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) return DEFAULT_CATALOG;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (e) {
    console.warn("Failed to load catalog from localStorage:", e);
  }
  return DEFAULT_CATALOG;
}

export function saveStoredCatalog(items: CatalogItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("savo_catalog_updated"));
  } catch (e) {
    console.warn("Failed to save catalog to localStorage:", e);
  }
}
