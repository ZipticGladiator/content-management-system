import "server-only";

export type TopPerformer = {
  title: string;
  views: number;
};

export type ScriptDraftInput = {
  platform: "YouTube" | "TikTok";
  title: string;
  pitch: string;
  category: string;
  topPerformers: TopPerformer[];
};

function buildPrompt({ platform, title, pitch, category, topPerformers }: ScriptDraftInput): string {
  const formatNotes =
    platform === "YouTube"
      ? "This is a long-form YouTube video (likely 8-15 minutes). The hook is the first 10-15 seconds before the intro. Structure the outline as clear sections/beats a viewer can follow, ending on a call to action (subscribe, or the specific next step that fits the pitch)."
      : "This is a short-form TikTok clip (under 60 seconds). The hook is the first 1-2 seconds on screen — it has to stop the scroll immediately. Structure the outline as fast, punchy beats with no wasted words, ending on a quick call to action.";

  const performersBlock = topPerformers.length
    ? `Here are past videos on this channel that performed well, for reference on what has worked before (title — lifetime views):\n${topPerformers
        .map((p) => `- "${p.title}" — ${p.views.toLocaleString()} views`)
        .join("\n")}\n\nWhere it makes sense, borrow the hook style or structural pattern that made those work — but don't copy their subject matter.`
    : `No past performance data is available yet for this channel, so lean on general best practices for cybersecurity content on this platform.`;

  return `You are a scriptwriting assistant for "Siya | Cybersecurity", a YouTube/TikTok channel making ${category.toLowerCase()} cybersecurity content.

${formatNotes}

New video idea:
- Title: ${title}
- Category: ${category}
- Pitch: ${pitch || "(no pitch written yet — infer a reasonable angle from the title)"}

${performersBlock}

Write a script draft with two parts:
1. HOOK — the exact opening lines, written to be read aloud.
2. OUTLINE — a bulleted list of the beats/sections the rest of the script should hit, in order, ending with a call to action.

Keep it specific to this topic, not generic advice. Output plain text only — no markdown headers, no asterisks for bold, just the two labeled sections and plain bullet lines starting with "-".`;
}

const GEMINI_MODEL = "gemini-3.6-flash";

async function callGemini(apiKey: string, prompt: string): Promise<string | null> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );
  if (!res.ok) return null;

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof text === "string" ? text.trim() : null;
}

/**
 * Generates a hook + outline draft from a video's pitch and, when available,
 * this channel's best-performing past videos. Returns null if no API key is
 * configured or the call fails, so callers can show a friendly fallback
 * instead of a stack trace. Retries up to twice more — this model returns a
 * transient 503 ("high demand") on roughly a third of calls, so three tries
 * brings the odds of total failure down to under 5%.
 */
export async function generateScriptDraft(input: ScriptDraftInput): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const prompt = buildPrompt(input);
  const attempts = 3;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const text = await callGemini(apiKey, prompt);
      if (text) return text;
    } catch {
      // fall through to retry/give up below
    }
    if (attempt < attempts - 1) await new Promise((r) => setTimeout(r, 1500));
  }
  return null;
}
