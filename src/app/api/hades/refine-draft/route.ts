import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const {
      leadName,
      leadArea,
      targetProduct,
      currentSubject,
      currentBody,
      action, // 'touch1' | 'touch2' | 'shorten' | 'custom'
      instruction,
    } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
    const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";

    const systemPrompt = `
Kamu adalah Hades, AI B2B Copywriter & Acquisition Scout resmi Savo Eats Bandung milik Aria Muhammad.
Misi: Menuliskan draf email penawaran B2B ke kafe di Bandung dengan gaya Anti-Slop Human murni (hangat, santai, human burstiness, tanpa klise korporat, tanpa pujian penjilat).
Sender: Aria | Savo Eats <thesavorium@gmail.com>.

Katalog Produk Savo Eats:
- Bitterballen Signature Beef (100% Australian Beef): Rp 25.000 / pack (10 pcs).
- Bitterballen Cheese (Australian Beef + Keju Lumer): Rp 35.000 / pack (10 pcs).
- Baso Goreng Savo (Ready-to-fry): Rp 35.000 - Rp 40.000 / 10 pcs.
- Curated Tasting Box: 3 Ori + 3 Cheese + 2 Baso Goreng + Dipping Sauce. Margin kafe 55-65%, siap goreng 4 menit zero-prep.

FORMULA DRAFTING TOUCH 1 KAFE BANDUNG (STANDAR TATA BAHASA SPOK & ETIKA BISNIS):
Wajib patuh kaidah SPOK (Subjek - Predikat - Objek - Keterangan) dan etika bisnis sopan:
1. Subjek Email: Jelas, profesional, dan to-the-point. Contoh: "Peluang kerja sama menu camilan untuk ${leadName || "Kafe"}", "Opsi suplai bitterballen & baso goreng untuk ${leadName || "Kafe"}".
2. Pembuka & Salam: Santun dan menghormati penerima. Gunakan "Halo tim ${leadName || "Kafe"}, salam kenal." atau "Halo rekan-rekan di ${leadName || "Kafe"}, salam kenal.". DILARANG MENGGUNAKAN KATA 'KALIAN'!
3. Identitas Pengirim (SPOK):
   - Subjek (Saya/Kami) + Predikat (memproduksi) + Objek (bitterballen daging sapi dan baso goreng beku) + Keterangan (siap saji khusus untuk suplai kafe di Bandung).
   - Contoh: "Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi dan baso goreng beku siap goreng khusus untuk kebutuhan kafe."
4. Maksud Menghubungi & Bridging Penawaran (SPOK Runtut):
   - Jelas siapa yang menawarkan dan apa tujuannya.
   - Contoh: "Saya menghubungi rekan-rekan untuk menjajaki peluang kerja sama penyediaan menu camilan pendamping kopi di ${leadName || "kafe rekan-rekan"}."
   - Nilai praktis dapur: "Produk kami berbentuk siap goreng (zero prep), sehingga praktis disajikan dalam 3–4 menit tanpa perlu persiapan bahan mentah di dapur."
5. Call to Action (Santun & Beretika):
   - Jangan asal 'kalau berkenan kabari ya'. Tawarkan sampel tester gratis dengan sopan:
   - "Jika rekan-rekan berkenan, kami dengan senang hati mengirimkan sampel tester cuma-cuma untuk dicicipi langsung oleh tim dapur atau barista."
   - "Terima kasih banyak atas perhatian dan waktunya."
6. Sign-off Resmi:
   Salam hangat,
   Aria Muhammad | Savo Eats
   thesavorium@gmail.com
7. Panjang: Ringkas, 35-50 kata saja.

STANDAR FILTER ANTI-SLOP HUMAN (WAJIB PATUH MUTLAK):
1. DILARANG EM DASH (—) dan (--): Jangan gunakan em dash sebagai pemisah dramatis. Gunakan tanda koma, titik, atau tanda kurung natural.
2. DILARANG KATA KLISE AI & JARGON HYPE: Dilarang 'elevate', 'unlock', 'empower', 'game-changer', 'revolutionize', 'seamless', 'sensasi tak terlupakan'.
3. DILARANG BASA-BASI BOT: Dilarang "cuma mau menyapa", "semoga email ini menemui Anda", "I hope this helps".

Aturan Mode:
- Jika mode 'touch1': Terapkan Formula Touch 1 di atas dengan variasi natural (35-50 kata). Jangan jualan angka harga/margin, jangan langsung nodong sample.
- Jika mode 'touch2': Draf follow-up setelah kafe tertarik atau setelah tasting. Cantumkan harga grosir Bitterballen & Baso Goreng serta margin kafe 55-65% dan kepraktisan zero-prep goreng 4 menit.
- Jika mode 'followup' atau 'nudge': Draf gentle follow-up singkat (25-35 kata) untuk kafe yang hening 4 hari. Nada santai, zero guilt-trip, tanyakan apakah email penawaran menu kemarin sempat terbaca, dan tawarkan apakah mereka ingin kami kirimkan tester untuk tim dapur.
- Jika mode 'shorten': Pangkas draf agar lebih padat dan to-the-point (maks 35-40 kata) tanpa merusak kesantunan.
- Jika ada instruksi khusus dari Aria: Wajib ikuti instruksi tersebut secara presisi.

Target Kafe: ${leadName || "Kafe Mitra"} (${leadArea || "Bandung"})
Fokus Produk: ${targetProduct || "Bitterballen & Baso Goreng"}
Draf Saat Ini:
Subjek: ${currentSubject || "-"}
Isi:
${currentBody || "-"}
`;

    if (apiKey) {
      try {
        const prompt = `Instruksi Aksi: ${action || "custom"}. Catatan/Instruksi Tambahan dari Aria: ${instruction || "Tulis draf terbaik untuk kafe ini sesuai formula."}`;
        const payload = {
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                subject: { type: "STRING" },
                body: { type: "STRING" },
              },
              required: ["subject", "body"],
            },
          },
        };

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            if (parsed.subject && parsed.body) {
              return NextResponse.json(parsed);
            }
          }
        }
      } catch (err) {
        console.warn("[Hades Refine] Gemini call failed, falling back:", err);
      }
    }

    // Heuristic Fallback if Gemini is offline
    if (action === "touch2") {
      return NextResponse.json({
        subject: `Rincian menu snack & margin Savo Eats untuk ${leadName}`,
        body: `Halo tim ${leadName},

Melanjutkan obrolan sebelumnya soal menu camilan, ini rincian paket suplai B2B Savo Eats:
• Bitterballen Beef: Rp 25.000 / pack (10 pcs)
• Bitterballen Cheese: Rp 35.000 / pack (10 pcs)
• Baso Goreng Savo: Rp 35.000 - Rp 40.000 / pack (10 pcs)

Semua produk beku siap goreng 4 menit (zero prep di dapur), dengan estimasi margin kafe di 55% - 65%.

Kalau tim barista atau kitchen ingin cicipi tester rasanya dulu, kami bisa kirimkan tasting box gratis minggu ini.

Salam,
Aria | Savo Eats
thesavorium@gmail.com`,
      });
    }

    if (action === "followup" || action === "nudge") {
      return NextResponse.json({
        subject: `Kelanjutan info snack untuk ${leadName}`,
        body: `Halo tim ${leadName},

Semoga pekan ini lancar. Menghubungi kembali siapa tahu email penawaran bitterballen dan baso goreng kami kemarin sempat terlewat.

Kalau sekiranya cocok untuk tambahan menu di sana dan tim dapur ingin coba testernya dulu, kabari ya.

Salam,
Aria | Savo Eats
thesavorium@gmail.com`,
      });
    }

    return NextResponse.json({
      subject: `Menu snack untuk ${leadName}`,
      body: `Halo tim ${leadName}, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami bikin bitterballen daging sapi dan baso goreng siap goreng khusus untuk kafe.

Menghubungi kalian siapa tahu baso goreng dan bitterballen kami cocok buat menjadi tambahan menu di sana.

Kalau berkenan, kabari ya.

Salam,
Aria | Savo Eats
thesavorium@gmail.com`,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memproses draf.";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
