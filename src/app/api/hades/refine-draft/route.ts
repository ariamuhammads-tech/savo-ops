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
Misi: Menuliskan draf email penawaran B2B ke kafe di Bandung dengan gaya Anti-Slop (hangat, santai, apresiatif, human burstiness, tanpa klise korporat).
Sender: Savo Eats <thesavorium@gmail.com>.

Katalog Produk Savo Eats:
- Bitterballen Signature Beef (100% Australian Beef): Rp 25.000 / pack (10 pcs).
- Bitterballen Cheese (Australian Beef + Keju Lumer): Rp 35.000 / pack (10 pcs).
- Baso Goreng Savo (Ready-to-fry): Rp 35.000 - Rp 40.000 / 10 pcs.
- Curated Tasting Box (Gratis): 3 Ori + 3 Cheese + 2 Baso Goreng + Dipping Sauce. Margin kafe 55-65%, siap goreng 4 menit zero-prep.

Aturan Mode:
- Jika mode 'touch1': Buat draf pendek (40-60 kata), santai, apresiasi vibe kafe, tawarkan kirim 1 Curated Tasting Box gratis untuk dicicipi barista/kitchen. JANGAN jualan angka harga/margin di touch 1.
- Jika mode 'touch2': Draf follow-up setelah tasting dicicipi. Sebutkan harga grosir Bitterballen & Baso Goreng serta margin kafe 55-65% dan kepraktisan zero-prep goreng 4 menit.
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
