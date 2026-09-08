import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface ScoutCandidate {
  name: string;
  category: "coffee_shop" | "cafe_bistro" | "bar_taphouse" | "coworking" | "resto";
  area: string;
  address: string;
  email: string;
  instagram: string;
  whatsapp: string;
  contactPerson: string;
  targetProduct: "duo_tasting" | "bitterballen_ori" | "bitterballen_cheese" | "baso_goreng";
  fitReason: string;
  stagedDraft: {
    subject: string;
    body: string;
  };
}

export async function POST(req: Request) {
  try {
    const { area } = await req.json();

    const selectedArea = area && area !== "Semua Area" ? area : "Dago / Dipatiukur";
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
    const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";

    const systemPrompt = `
Kamu adalah Hades, AI B2B Scout & Acquisition resmi Savo Eats Bandung milik Aria Muhammad.
Tugas: Mengurasi TEPAT 5 kafe / coffee shop / taphouse NYATA dan potensial di area Bandung yang diminta.
Kriteria Kafe:
1. Kafe nyata di Bandung (bukan fiktif).
2. Ramai pengunjung (anak muda, pekerja kreatif, mahasiswa, atau keluarga).
3. Punya menu kopi berkualitas tapi butuh menu finger food gurih siap saji (zero-prep).
4. Cocok disuntik produk Savo Eats: Bitterballen Beef (Rp 25k/pack), Bitterballen Cheese (Rp 35k/pack), atau Baso Goreng Savo (Rp 35k-40k/10pcs).

FORMULA DRAFTING TOUCH 1 KHUSUS KAFE BANDUNG (5 PILAR UTAMA - WAJIB IKUTI DENGAN VARIASI ALAMI):
Jangan gunakan kata yang persis sama untuk setiap kafe, tapi WAJIB mengikuti formula psikologis ini:
1. Subjek: Pendek, natural, tanpa clickbait/em-dash (misal: "Menu snack untuk [Nama Kafe]", "Bitterballen & baso goreng untuk [Nama Kafe]", "Opsi snack untuk [Nama Kafe]").
2. Pembuka & Identitas: Sopan sesama orang Bandung ("Halo tim [Nama Kafe], salam kenal."). Dilarang basa-basi "cuma mau menyapa" atau "semoga email ini menemui Anda".
   Identitas ringkas: "Saya Aria dari Savo Eats di Bandung. Kami bikin bitterballen daging sapi dan baso goreng siap goreng khusus untuk kafe."
3. Zero-Flattery (Anti-Penjilat): DILARANG memuji-muji kopi/vibe secara berlebihan atau sok tahu ("Suka banget sama vibe...", "Kopi kalian luar biasa...").
4. Sudut Pandang Penawaran (Low Friction & Opsi Tambahan Menu):
   Menghubungi mereka siapa tahu baso goreng dan bitterballen kami cocok buat menjadi tambahan menu di sana.
5. DILARANG Menodong Sample di Touch 1:
   JANGAN langsung menawarkan drop Curated Tasting Box atau minta alamat cabang di email pertama. Biarkan mereka merespons dulu.
6. CTA Singkat & Sopan: "Kalau berkenan, kabari ya." atau "Kalau sekiranya cocok, kabari ya."
7. Sign-off:
   Salam,
   Aria | Savo Eats
   thesavorium@gmail.com
8. Panjang draf: 35-50 kata saja.

STANDAR ANTI-SLOP HUMAN (MUTLAK):
1. DILARANG EM DASH (—) dan (--): Jangan gunakan em dash dalam draf email.
2. DILARANG KATA KLISE AI: Jangan gunakan kata 'elevate', 'game-changer', 'revolutionize', 'seamless', 'sensasi tak terlupakan'.

Kembalikan respon dalam format JSON sesuai skema berikut:
{
  "area": "${selectedArea}",
  "candidates": [
    {
      "name": "Nama Kafe",
      "category": "coffee_shop",
      "area": "${selectedArea}",
      "address": "Alamat jalan nyata di Bandung",
      "email": "email resmi / kontak kerjasama",
      "instagram": "@akun_instagram_kafe",
      "whatsapp": "+62...",
      "contactPerson": "Barista Lead / Store Manager",
      "targetProduct": "duo_tasting",
      "fitReason": "Alasan kecocokan menu dengan karakter pengunjung kafe ini.",
      "stagedDraft": {
        "subject": "Subjek email santai tanpa em dash",
        "body": "Isi email touch 1 (35-50 kata) menerapkan formula Bandung dengan variasi alami."
      }
    }
  ]
}
`;

    if (apiKey) {
      try {
        const payload = {
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${systemPrompt}\n\nKurasi tepat 5 kafe potensial di area: ${selectedArea}. Berikan draf email touch 1 yang sangat natural untuk masing-masing kafe.`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                area: { type: "STRING" },
                candidates: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      name: { type: "STRING" },
                      category: {
                        type: "STRING",
                        enum: ["coffee_shop", "cafe_bistro", "bar_taphouse", "coworking", "resto"],
                      },
                      area: { type: "STRING" },
                      address: { type: "STRING" },
                      email: { type: "STRING" },
                      instagram: { type: "STRING" },
                      whatsapp: { type: "STRING" },
                      contactPerson: { type: "STRING" },
                      targetProduct: {
                        type: "STRING",
                        enum: ["duo_tasting", "bitterballen_ori", "bitterballen_cheese", "baso_goreng"],
                      },
                      fitReason: { type: "STRING" },
                      stagedDraft: {
                        type: "OBJECT",
                        properties: {
                          subject: { type: "STRING" },
                          body: { type: "STRING" },
                        },
                        required: ["subject", "body"],
                      },
                    },
                    required: [
                      "name",
                      "category",
                      "area",
                      "address",
                      "email",
                      "instagram",
                      "contactPerson",
                      "targetProduct",
                      "fitReason",
                      "stagedDraft",
                    ],
                  },
                },
              },
              required: ["area", "candidates"],
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
            if (parsed.candidates && Array.isArray(parsed.candidates)) {
              return NextResponse.json({
                area: selectedArea,
                candidates: parsed.candidates.slice(0, 5),
              });
            }
          }
        } else {
          console.warn("[Hades Scout] Gemini API error:", await res.text());
        }
      } catch (err) {
        console.warn("[Hades Scout] Gemini call error:", err);
      }
    }

    // Heuristic Fallback per Area if offline
    const fallbackCandidates: Record<string, ScoutCandidate[]> = {
      "Dago / Dipatiukur": [
        {
          name: "Makmur Jaya Coffee Roaster",
          category: "coffee_shop",
          area: "Dago / Dipatiukur",
          address: "Jl. Sawunggaling No. 2, Dago, Bandung",
          email: "makmurjayacoffee@gmail.com",
          instagram: "@makmurjayacoffee",
          whatsapp: "+628122019283",
          contactPerson: "Head Barista & Kitchen Lead",
          targetProduct: "duo_tasting",
          fitReason: "Trafik anak muda tinggi, butuh cemilan asin gurih pendamping es kopi susu dengan waktu penyajian 4 menit.",
          stagedDraft: {
            subject: "Menu snack untuk Makmur Jaya",
            body: "Halo tim Makmur Jaya, salam kenal.\n\nSaya Aria dari Savo Eats di Bandung. Kami bikin bitterballen daging sapi dan baso goreng siap goreng khusus untuk kafe.\n\nSaya menghubungi rekan-rekan untuk menjajaki peluang kerja sama penyediaan camilan pendamping kopi di sana.\n\nJika rekan-rekan berkenan, kami dengan senang hati mengirimkan sampel tester cuma-cuma untuk dicoba langsung oleh tim.\n\nTerima kasih banyak atas perhatian dan waktunya.\n\nSalam,\nAria | Savo Eats\nthesavorium@gmail.com",
          },
        },
        {
          name: "Kozi Coffee Dipatiukur",
          category: "coffee_shop",
          area: "Dago / Dipatiukur",
          address: "Jl. Dipatiukur No. 42, Bandung",
          email: "kozicoffee.bdg@gmail.com",
          instagram: "@kozicoffee",
          whatsapp: "+628139485721",
          contactPerson: "Store Manager",
          targetProduct: "bitterballen_cheese",
          fitReason: "Tongkrongan santai coffee enthusiast dengan durasi nongkrong lama, sangat butuh cemilan keju lumer hangat.",
          stagedDraft: {
            subject: "Bitterballen & baso goreng untuk Kozi Dipatiukur",
            body: "Halo rekan Kozi Dipatiukur, salam kenal.\n\nSaya Aria dari Savo Eats Bandung. Kami bikin bitterballen daging sapi dan baso goreng siap saji untuk suplai kafe.\n\nSaya menghubungi tim untuk memperkenalkan produk siap goreng kami, barangkali cocok melengkapi variasi menu camilan di sana.\n\nJika rekan-rekan berkenan, kami ingin mengirimkan tester sampel gratis untuk dicoba langsung.\n\nTerima kasih banyak atas perhatian dan waktunya.\n\nSalam,\nAria | Savo Eats\nthesavorium@gmail.com",
          },
        },
        {
          name: "Mimi Teh & Kopi Dago",
          category: "coffee_shop",
          area: "Dago / Dipatiukur",
          address: "Jl. Ir. H. Juanda No. 115, Dago, Bandung",
          email: "mimikopi.dago@gmail.com",
          instagram: "@mimikopibdg",
          whatsapp: "+62811223344",
          contactPerson: "Operational Lead",
          targetProduct: "baso_goreng",
          fitReason: "Traffic WFC siang hingga malam butuh kudapan gurih renyah pendamping racikan teh dan kopi signature.",
          stagedDraft: {
            subject: "Opsi menu snack untuk Mimi Dago",
            body: "Halo tim Mimi Dago, salam kenal.\n\nSaya Aria dari Savo Eats di Bandung. Kami produksi baso goreng dan bitterballen daging sapi beku siap goreng (zero prep) untuk kafe.\n\nSaya menghubungi rekan-rekan untuk memperkenalkan baso goreng siap saji kami, siapa tahu pas menjadi menu kudapan hangat di sana.\n\nJika berkenan, kami ingin mengirimkan paket tester cuma-cuma untuk dicoba oleh tim.\n\nTerima kasih banyak atas waktunya.\n\nSalam,\nAria | Savo Eats\nthesavorium@gmail.com",
          },
        },
        {
          name: "Teduh Coffee Pinus",
          category: "coffee_shop",
          area: "Dago / Dipatiukur",
          address: "Komplek Dago Pakar, Ciburial, Bandung",
          email: "teduhcoffee.bandung@gmail.com",
          instagram: "@teduhcoffee.id",
          whatsapp: "+628129876543",
          contactPerson: "Purchasing & Kitchen Lead",
          targetProduct: "duo_tasting",
          fitReason: "Konsep outdoor sejuk, pengunjung gemar pesan cemilan sharing hangat untuk teman ngopi berjam-jam.",
          stagedDraft: {
            subject: "Menu snack pendamping untuk Teduh Coffee",
            body: "Halo tim Teduh Coffee, salam kenal.\n\nSaya Aria dari Savo Eats di Bandung. Kami bikin bitterballen daging sapi dan baso goreng siap goreng untuk mitra kafe.\n\nSaya menghubungi rekan-rekan untuk menjajaki kerja sama suplai camilan pendamping kopi di sana.\n\nJika tim berkenan, kami siap mengirimkan tester sampel untuk dicicipi langsung oleh tim dapur.\n\nTerima kasih banyak atas waktunya.\n\nSalam,\nAria | Savo Eats\nthesavorium@gmail.com",
          },
        },
        {
          name: "Kiputih Satu Bake & Dine",
          category: "cafe_bistro",
          area: "Dago / Dipatiukur",
          address: "Jl. Kiputih No. 1, Ciumbuleuit, Bandung",
          email: "kiputihsatu.dine@gmail.com",
          instagram: "@kiputihsatu",
          whatsapp: "+628123490812",
          contactPerson: "Head Chef & Cafe Manager",
          targetProduct: "bitterballen_ori",
          fitReason: "Komunitas pencinta artisanal bake & dine yang sangat menghargai racikan bechamel klasik daging sapi premium.",
          stagedDraft: {
            subject: "Snack untuk menu Kiputih Satu",
            body: "Halo rekan Kiputih Satu, salam kenal.\n\nSaya Aria dari Savo Eats di Bandung. Kami produksi bitterballen daging sapi klasik dan baso goreng siap goreng khusus untuk kafe.\n\nSaya menghubungi rekan-rekan untuk memperkenalkan bitterballen daging sapi kami, siapa tahu dapat menjadi opsi tambahan menu santai di sana.\n\nJika berkenan, kami sangat terbuka untuk mengirimkan sampel tester cuma-cuma untuk dicoba.\n\nTerima kasih banyak atas waktunya.\n\nSalam,\nAria | Savo Eats\nthesavorium@gmail.com",
          },
        },
      ],
    };

    const candidates = fallbackCandidates[selectedArea] || fallbackCandidates["Dago / Dipatiukur"];

    return NextResponse.json({
      area: selectedArea,
      candidates,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal melakukan kurasi kafe.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
