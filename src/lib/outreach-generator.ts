import { Lead } from "./leads-data";

export type PitchType = "free_tester" | "b2b_wholesale" | "follow_up_tester";

export const PITCH_TYPES: { id: PitchType; label: string; description: string }[] = [
  {
    id: "free_tester",
    label: "Penawaran Free Tester Pack",
    description: "Kirim tester gratis tanpa biaya untuk dicicipi barista / kitchen / owner kafe.",
  },
  {
    id: "b2b_wholesale",
    label: "Penawaran Suplai & Margin B2B",
    description: "Penawaran harga grosir, margin keuntungan 40-50%, dan kepraktisan penyajian.",
  },
  {
    id: "follow_up_tester",
    label: "Follow-Up Setelah Tester",
    description: "Menanyakan respon rasa tester yang sudah dikirim dan opsi skema kemitraan.",
  },
];

export function cleanIndonesianPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  } else if (!cleaned.startsWith("62")) {
    cleaned = "62" + cleaned;
  }
  return cleaned;
}

export function generatePitchText(lead: Lead, type: PitchType = "free_tester"): string {
  const venue = lead.name;
  const pic = lead.contactPerson && !lead.contactPerson.includes("/") ? `kak ${lead.contactPerson}` : "kak";

  if (type === "free_tester") {
    let productDesc = "";
    if (lead.targetProduct === "baso_goreng") {
      productDesc = "Baso Goreng SAVO (homemade renyah kopong, siap goreng)";
    } else if (lead.targetProduct === "bitterballen_cheese") {
      productDesc = "Bitterballen Cheese (Daging Sapi Australia 100% + keju meleleh, signature snack)";
    } else if (lead.targetProduct === "bitterballen_ori") {
      productDesc = "Bitterballen Original (Daging Sapi Australia 100% creamy rempah pala Belanda)";
    } else {
      productDesc = "Bitterballen Sapi Australia dan Baso Goreng siap saji";
    }

    return (
      `Halo ${pic} & tim ${venue}, salam kenal dari Aria - SAVO Bandung.\n\n` +
      `Saya perhatikan suasana dan pengunjung di ${venue} sangat pas untuk menu finger food gurih pendamping kopi / nongkrong.\n\n` +
      `SAVO adalah produsen homemade frozen food premium di Bandung. Produk andalan kami adalah ${productDesc}.\n\n` +
      `Keunggulan untuk menu kafe:\n` +
      `• Praktis: Staf bar / kitchen tinggal deep fry 3-5 menit (tanpa perlu chef khusus).\n` +
      `• Konsisten: Standar rasa terjaga dan zero food waste (sistem beku).\n` +
      `• Margin sehat: Rata-rata mitra kafe kami mengambil margin 40% - 50% per porsi.\n\n` +
      `Jika diperkenankan, kami ingin mengirimkan 1 Sample Box (Tester Bebas Biaya) langsung ke ${venue} agar tim bisa mencicipi langsung kualitasnya.\n\n` +
      `Kira-kira hari apa yang paling cocok untuk kami antar ya kak? Terima kasih banyak!`
    );
  }

  if (type === "b2b_wholesale") {
    return (
      `Halo ${pic} & tim ${venue}, terima kasih sebelumnya atas waktunya.\n\n` +
      `Menindaklanjuti rencana penambahan varian menu cemilan di ${venue}, berikut rangkuman skema suplai B2B dari SAVO:\n\n` +
      `1. Bitterballen Beef Australian (Signature):\n` +
      `   • Kemasan B2B isi 25 pcs atau 50 pcs (frozen pack).\n` +
      `   • Estimasi HPP per porsi (isi 4-5 pcs): ~Rp 14.000 - Rp 16.000.\n` +
      `   • Saran harga jual menu: Rp 28.000 - Rp 35.000 (Margin ~45-52%).\n\n` +
      `2. Baso Goreng SAVO (Ready-to-Fry):\n` +
      `   • Tekstur garing luar, lembut kopong dalam, rasa gurih umami asli.\n` +
      `   • Waktu goreng singkat, disukai semua kalangan.\n\n` +
      `• Minimal order B2B sangat fleksibel dan gratis ongkir untuk area Bandung kota.\n` +
      `• Pembayaran bisa tempo / invoice resmi untuk kemitraan rutin.\n\n` +
      `Boleh kami kirimkan price list lengkap format PDF ke WhatsApp ini kak?`
    );
  }

  if (type === "follow_up_tester") {
    return (
      `Halo ${pic}, apa kabar? Semoga operasional di ${venue} lancar selalu ya.\n\n` +
      `Mau menanyakan kabar untuk paket tester SAVO yang kemarin kami kirimkan, apakah sudah sempat dicicipi bersama tim kitchen / barista?\n\n` +
      `Kami sangat terbuka untuk masukan atau feedback dari tim ${venue}. Bila cocok dan ingin uji coba menu reguler, kami siap bantu siapkan pengiriman perdana dengan harga khusus mitra baru.\n\n` +
      `Ditunggu kabarnya ya kak, terima kasih banyak!`
    );
  }

  return "";
}

export function buildWhatsAppLink(phone: string, text: string): string {
  const cleaned = cleanIndonesianPhone(phone);
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
}
