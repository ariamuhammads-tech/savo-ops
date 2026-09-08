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
Misi: Menuliskan draf email penawaran B2B ke kafe di Bandung dengan gaya Anti-Slop Human murni (hangat, santai, apresiatif, human burstiness, tanpa klise korporat).
Sender: Savo Eats <thesavorium@gmail.com>.

Katalog Produk Savo Eats:
- Bitterballen Signature Beef (100% Australian Beef): Rp 25.000 / pack (10 pcs).
- Bitterballen Cheese (Australian Beef + Keju Lumer): Rp 35.000 / pack (10 pcs).
- Baso Goreng Savo (Ready-to-fry): Rp 35.000 - Rp 40.000 / 10 pcs.
- Curated Tasting Box (Gratis): 3 Ori + 3 Cheese + 2 Baso Goreng + Dipping Sauce. Margin kafe 55-65%, siap goreng 4 menit zero-prep.

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

Aturan Mode:
- Jika mode 'touch1': Buat draf pendek (40-60 kata), santai, apresiasi vibe kafe, tawarkan kirim 1 Curated Tasting Box gratis untuk dicicipi barista/kitchen. JANGAN jualan angka harga/margin di touch 1.
- Jika mode 'touch2': Draf follow-up setelah tasting dicicipi. Sebutkan harga grosir Bitterballen & Baso Goreng serta margin kafe 55-65% dan kepraktisan zero-prep goreng 4 menit.
- Jika mode 'followup' atau 'nudge': Draf gentle follow-up singkat (25-35 kata) untuk kafe yang belum membalas email pertama setelah 4 hari. Nada santai, zero guilt-trip, bersahabat, tanyakan apakah email sebelumnya sempat terbaca atau masuk tab promosi, tawarkan drop 1 box tester minggu ini.
- Jika mode 'shorten': Pangkas draf saat ini agar lebih padat, ringkas (maks 40 kata), dan to-the-point tanpa mengurangi kehangatan.
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
        const prompt = `Instruksi Aksi: ${action || "custom"}. Catatan/Instruksi Tambahan dari Aria: ${instruction || "Tulis draf terbaik untuk kafe ini."}`;
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
        subject: `Kelanjutan Tasting Box Savo Eats — Info Menu & Margin untuk ${leadName}`,
        body: `Halo tim ${leadName},

Semoga Curated Tasting Box kemarin sudah sempat dicicipi bareng tim barista dan kitchen.

Kalau rasa dan teksturnya cocok untuk mendampingi menu kopi kalian, ini rincian paket B2B Savo Eats:
• Bitterballen Beef: Rp 25.000 / pack (10 pcs)
• Bitterballen Cheese: Rp 35.000 / pack (10 pcs)
• Baso Goreng Savo: Rp 35.000 - Rp 40.000 / pack (10 pcs)

Semua sudah beku siap goreng 4 menit (zero prep), dengan estimasi margin kafe di 55% - 65%.

Boleh kita jadwalkan supply batch pertama minggu ini?

Cheers,
Hades | Savo Eats
thesavorium@gmail.com`,
      });
    }

    if (action === "followup" || action === "nudge") {
      return NextResponse.json({
        subject: `Tester Tasting Box Savo Eats untuk ${leadName}`,
        body: `Halo tim ${leadName},

Cuma mau make sure email penawaran tester box kami kemarin sempat terbaca atau mungkin nyasar ke tab promosi.

Kami masih simpan slot 1 Curated Tasting Box gratis (isi Bitterballen & Baso Goreng) buat dicicipi barista lead atau tim dapur kalian minggu ini. Boleh kami antar testernya besok atau lusa?

Cheers,
Hades | Savo Eats
thesavorium@gmail.com`,
      });
    }

    return NextResponse.json({
      subject: `Kirim Curated Tasting Box buat tim ${leadName}?`,
      body: `Halo tim ${leadName},

Suka banget sama karakter dan konsistensi kopi kalian di ${leadArea}.

Saya Hades dari Savo Eats Bandung. Kita mau kirim 1 Curated Tasting Box gratis (isi Bitterballen Beef, Cheese, Baso Goreng + Dipping Sauce) khusus buat dicicipi barista lead atau kitchen team ${leadName}.

Kira-kira cabang mana yang paling pas buat kita drop tester? Murni buat dicicipi tim aja, no strings attached.

Cheers,
Hades | Savo Eats
thesavorium@gmail.com`,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memproses draf.";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
