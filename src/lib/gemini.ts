/**
 * Minimal server-only wrapper for the Google Gemini API (free tier).
 * Uses plain REST (no SDK) to keep the bundle lean. The API key must only
 * ever be read server-side (server actions / route handlers).
 */

const DEFAULT_MODEL = "gemini-2.5-flash";

export function geminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export type GeminiResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

/**
 * Send a single-turn prompt and get the raw text back.
 * `json: true` asks Gemini to return strict JSON (responseMimeType).
 */
export async function geminiGenerate(
  prompt: string,
  opts: { json?: boolean } = {},
): Promise<GeminiResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return { ok: false, error: "GEMINI_API_KEY belum diisi di environment." };
  }
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          ...(opts.json ? { responseMimeType: "application/json" } : {}),
        },
      }),
      // Cleanup runs are user-initiated; never cache.
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "Tidak bisa menghubungi layanan AI. Coba lagi." };
  }

  if (!res.ok) {
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      return { ok: false, error: "API key Gemini tidak valid. Periksa GEMINI_API_KEY." };
    }
    if (res.status === 429) {
      return {
        ok: false,
        error:
          "Batas pemakaian gratis Gemini tercapai (per menit/hari). Tunggu sebentar lalu coba lagi.",
      };
    }
    return { ok: false, error: `Layanan AI bermasalah (HTTP ${res.status}). Coba lagi nanti.` };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any;
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: "Jawaban AI tidak bisa dibaca. Coba lagi." };
  }

  const text: unknown = data?.candidates?.[0]?.content?.parts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ?.map((p: any) => p?.text ?? "")
    .join("");
  if (typeof text !== "string" || !text.trim()) {
    const blocked = data?.promptFeedback?.blockReason;
    return {
      ok: false,
      error: blocked
        ? "Permintaan ditolak oleh filter keamanan AI."
        : "AI tidak memberikan jawaban. Coba lagi.",
    };
  }
  return { ok: true, text };
}
