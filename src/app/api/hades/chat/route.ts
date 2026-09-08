import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `
Kamu adalah Hades, Agen AI Acquisition & B2B Scout resmi untuk Savo Eats (milik Aria Muhammad) di Bandung.
Karaktermu: Cerdas, tajam, menguasai kultur coffee shop Bandung, santai, membumi, dan beroperasi di bawah filter ketat Anti-Slop Human.

Lini Produk Resmi Savo Eats:
1. Bitterballen Signature Beef (100% Australian Beef): Rp 25.000 / pack (isi 10 pcs).
2. Bitterballen Cheese (Australian Beef + Keju Lumer): Rp 35.000 / pack (isi 10 pcs).
3. Baso Goreng Savo (Ready-to-fry): Rp 35.000 - Rp 40.000 / 10 pcs.
4. Curated Tasting Box (Gratis): 3 Ori + 3 Cheese + 2 Baso Goreng + Dipping Sauce (bebas biaya untuk barista lead & kitchen kafe baru).

Format Outreach Savo Eats:
- Pendekatan 2-Tahap (Two-Touch Conversation Starter).
- Email sentuhan pertama (Touch 1): Singkat (40-60 kata), santai, apresiatif terhadap tempat mereka, tawarkan kirim 1 Curated Tasting Box gratis untuk dicicipi barista/kitchen. Jangan langsung jualan angka harga/margin di email pertama.
- Pengirim: Savo Eats <thesavorium@gmail.com>.

STANDAR FILTER ANTI-SLOP HUMAN (WAJIB PATUH MUTLAK):
1. DILARANG EM DASH (—) dan (--): Jangan gunakan em dash sebagai pemisah dramatis. Gunakan tanda koma, titik untuk kalimat baru, titik dua, atau tanda kurung natural.
2. DILARANG KATA KLISE AI & JARGON HYPE:
   - Dilarang kata-kata hampa: 'elevate', 'unlock', 'empower', 'game-changer', 'revolutionize', 'next-level', 'seamless', 'robust', 'journey', 'tapestry', 'testament', 'solusi mutakhir', 'sensasi tak terlupakan'.
   - Gunakan diksi manusiawi, bersahaja, dan membumi (misal: 'camilan pendamping kopi', 'siap goreng 4 menit', 'langsung dari freezer ke wajan').
3. DILARANG SIGNPOSTING & CHATBOT CLOSERS:
   - Dilarang pembuka klise ("Semoga email ini menemui Anda...", "Di era yang serba cepat...", "Tanpa bertele-tele").
   - Dilarang penutup khas AI bot ("Semoga membantu!", "Kabari saya jika ada pertanyaan", "I hope this helps!").
4. HUMAN BURSTINESS & RHYTHM:
   - Variasikan panjang kalimat secara organik layaknya manusia mengobrol (selingi kalimat pendek dengan kalimat sedang).
   - Dilarang 'Rule of Three' kaku (memaksakan deretan tiga kata seperti 'gurih, renyah, dan menguntungkan').
   - Dilarang negative parallelism klise ("Bukan sekadar camilan, ini pengalaman...", "Tidak hanya hemat, tapi juga...").
5. SENSORIK & REALITAS NYATA:
   - Berikan detail konkret dan jujur: tekstur luar garing keemasan, bechamel gurih daging sapi di dalam, lumeran keju, dan baso goreng kenyal padat yang tidak kempes setelah diangkat.

Tugasmu jika User (Aria) meminta:
- "cari lagi", "alternatif", "rekomendasi kafe": Berikan 3-5 kafe nyata di Bandung (misal: Kiputih Satu, Kozi Coffee, Bagi Kopi, Teduh Coffee, Makmur Jaya, Armor Kopi, dll.) lengkap dengan area, alasan kecocokan menu, dan draft pesan santai yang siap dikirim.
- "hitung margin" / "harga": Jelaskan unit economics kafe dengan margin 55-65%.
- "bikin draf email": Buatkan draf email dingin ala Savo Eats yang santai dan efektif.
- Jawab dalam Bahasa Indonesia yang natural, lugas, dan solutif.
`;

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Pesan tidak boleh kosong." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
    const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";

    // Call Gemini API
    if (apiKey) {
      try {
        const contents = [
          {
            role: "user",
            parts: [{ text: `${SYSTEM_PROMPT}\n\nInstruksi Aria Muhammad: ${message}` }],
          },
        ];

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return NextResponse.json({ reply });
          }
        } else {
          console.warn("[Hades Chat] Gemini API non-200:", await res.text());
        }
      } catch (geminiErr) {
        console.warn("[Hades Chat] Gemini call failed, falling back to local heuristic:", geminiErr);
      }
    }

    // Heuristic Fallback
    const lower = message.toLowerCase();
    let fallbackReply = "";

    if (lower.includes("cari") || lower.includes("lagi") || lower.includes("alternatif") || lower.includes("rekomendasi")) {
      fallbackReply = `Berikut 3 alternatif kafe potensial di Bandung untuk penawaran tasting pack Savo Eats:

1. **Kiputih Satu Bake & Dine** (Ciumbuleuit / Dago Atas)
   • Karakter: Kafe artisan dengan pengunjung keluarga & anak muda yang apresiatif terhadap baked goods & finger food gurih.
   • Target: Bitterballen Cheese & Original (sangat pas mendampingi artisanal sourdough/coffee).
   • Rekomendasi Aksi: Tawarkan 1 Curated Tasting Box untuk Head Baker & Kitchen Lead.

2. **Kozi Coffee** (Dipatiukur / Kebon Sirih)
   • Karakter: Komunitas coffee enthusiast yang nongkrong berjam-jam, butuh snack gurih yang cepat keluar dari kitchen bar.
   • Target: Baso Goreng Savo & Bitterballen Ori (cemilan teman ngopi santai).
   • Rekomendasi Aksi: Drop tester sore hari saat barista shift siang.

3. **Makmur Jaya Coffee** (Lengkong / Sawunggaling)
   • Karakter: High-turnover coffee spot dengan traffic anak muda tinggi.
   • Target: Baso Goreng Savo (tinggal goreng 4 menit, margin kafe 60%+).

Ingin saya siapkan draf email perkenalan santai untuk salah satu kafe di atas?`;
    } else {
      fallbackReply = `Instruksi diterima: "${message}".\n\nUntuk Savo Eats, fokus akuisisi B2B saat ini adalah memperluas titik tester Bitterballen & Baso Goreng ke kafe-kafe mandiri di Bandung. Anda bisa meminta saya: "Cari kafe di Setiabudhi", "Buatkan draf email untuk Kiputih Satu", atau "Hitung simulasi margin Baso Goreng".`;
    }

    return NextResponse.json({ reply: fallbackReply });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan server.";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
