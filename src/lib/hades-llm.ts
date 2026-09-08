// Unified LLM Gateway for Agent Hades (Groq Primary + Gemini Fallback)

interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export async function callHadesLLM(
  systemPrompt: string,
  userPrompt: string,
  options?: CompletionOptions
): Promise<string | null> {
  const groqKey = process.env.GROQ_API_KEY || "";
  const groqModel = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";

  // 1. Primary Engine: Groq Cloud (Ultra-low latency, sub-second generation)
  if (groqKey) {
    try {
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];

      const bodyPayload: Record<string, unknown> = {
        model: groqModel,
        messages,
        temperature: options?.temperature ?? 0.3,
      };

      if (options?.jsonMode) {
        bodyPayload.response_format = { type: "json_object" };
      }

      if (options?.maxTokens) {
        bodyPayload.max_tokens = options.maxTokens;
      }

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(5000),
        headers: {
          Authorization: `Bearer ${groqKey}`,
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
        body: JSON.stringify(bodyPayload),
      });

      if (res.ok) {
        const data = await res.json();
        let content: string = data.choices?.[0]?.message?.content || "";
        if (options?.jsonMode && content.includes("```")) {
          content = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
        }
        if (content) return content;
      } else {
        console.warn("[Hades LLM] Groq API non-200:", res.status);
      }
    } catch (groqErr) {
      console.warn("[Hades LLM] Groq call failed or timed out:", groqErr);
    }
  }

  // 2. Secondary Engine: Google Gemini API (gemini-3.6-flash)
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  const geminiModel = process.env.GEMINI_MODEL || "gemini-3.6-flash";

  if (geminiKey) {
    try {
      const payload: Record<string, unknown> = {
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
      };

      if (options?.jsonMode) {
        payload.generationConfig = { responseMimeType: "application/json" };
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          signal: AbortSignal.timeout(6000),
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        const data = await res.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (options?.jsonMode && text && text.includes("```")) {
          text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
        }
        if (text) return text;
      }
    } catch (geminiErr) {
      console.warn("[Hades LLM] Gemini call failed:", geminiErr);
    }
  }

  return null;
}
