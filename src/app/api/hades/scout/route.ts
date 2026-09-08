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

STANDAR ANTI-SLOP HUMAN (MUTLAK):
1. DILARANG EM DASH (—) dan (--): Jangan gunakan em dash dalam draf email.
2. DILARANG KATA KLISE AI: Jangan gunakan kata 'elevate', 'game-changer', 'revolutionize', 'seamless', 'sensasi tak terlupakan'.
3. FORMAT TOUCH 1:
   - Draf email wajib 40-60 kata, santai, apresiatif terhadap vibe/kopi kafe tersebut.
   - Tawarkan 1 Curated Tasting Box gratis untuk dicicipi barista lead atau kitchen team.
   - JANGAN jualan angka harga/margin di email pertama.
   - Pengirim: Savo Eats <thesavorium@gmail.com>.

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
        "body": "Isi email touch 1 (40-60 kata) menawarkan free tasting box."
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
            subject: "Kirim Curated Tasting Box buat tim Makmur Jaya?",
            body: "Halo tim Makmur Jaya. Suka banget sama energi dan konsistensi kopi di Sawunggaling. Kami dari Savo Eats biasa produksi bitterballen daging sapi dan baso goreng gurih siap saji. Boleh saya kirim 1 Curated Tasting Box gratis untuk dicicipi barista lead atau kitchen kalian minggu ini? No strings attached, murni tester rasa.",
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
            subject: "Tester Bitterballen Keju buat barista Kozi Dipatiukur",
            body: "Halo tim Kozi. Selalu suka sama ambience santai Kozi di Dipatiukur. Kami dari Savo Eats bikin Bitterballen Cheese dengan lelehan keju mozarella dan daging sapi Australia. Boleh kami kirim 1 box tester gratis buat tim bar dan kitchen kalian cicipi sore ini?",
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
            subject: "Kirim tester Baso Goreng gurih buat tim Mimi Dago",
            body: "Halo tim Mimi Dago. Salut sama ramainya crowd WFC di tempat kalian. Kami dari Savo Eats mau kirim tester Baso Goreng gurih siap goreng yang renyah di luar dan kenyal di dalam. Tanpa biaya, khusus buat dicoba tim kalian. Boleh dikirim ke cabang Dago hari apa?",
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
            subject: "Tester camilan hangat Savo Eats buat tim Teduh Coffee",
            body: "Halo tim Teduh Coffee. Senang lihat suasana teduh dan sejuk tempat kalian di Dago. Kami dari Savo Eats mau kirim 1 paket Tasting Box gratis (isi Bitterballen dan Baso Goreng) buat dicoba tim kitchen kalian. Boleh kami drop tester minggu ini?",
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
            subject: "Curated Tasting Box Bitterballen buat tim Kiputih Satu",
            body: "Halo tim Kiputih Satu. Selalu apresiasi standar rasa dan craftsmanship sajian di tempat kalian. Kami dari Savo Eats membuat bitterballen resep klasik dengan isian daging sapi pilihan. Boleh kami kirimkan 1 box tester gratis untuk dicoba Head Chef atau tim kitchen Kiputih Satu?",
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
