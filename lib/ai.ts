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
// Single calls to this model commonly take 7-8s already (it "thinks" before
// answering), so a server-side retry loop here would risk stacking two or
// three of those back to back and blowing past a serverless function's
// execution limit. One attempt per invocation, with a hard timeout on the
// call itself; the client retries by re-invoking this action, so each try
// gets its own fresh time budget.
const REQUEST_TIMEOUT_MS = 9000;

export type DraftResult = { ok: true; text: string } | { ok: false; reason: string };

async function callGemini(apiKey: string, prompt: string): Promise<DraftResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          // This model "thinks" before answering, and that reasoning counts
          // against the same token budget — observed consuming 700-1100+
          // tokens on its own for this prompt. A low cap here doesn't bound
          // the answer, it silently truncates it (finishReason: MAX_TOKENS
          // with only a few dozen tokens of real output). This still bounds
          // runaway length without cutting a normal response short.
          generationConfig: { maxOutputTokens: 4096 },
        }),
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const reason: string = body?.error?.message || `Gemini returned HTTP ${res.status}`;
      return { ok: false, reason };
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string" || !text.trim()) {
      return { ok: false, reason: "Gemini returned an empty response" };
    }
    return { ok: true, text: text.trim() };
  } catch (err) {
    const reason =
      err instanceof Error && err.name === "AbortError"
        ? "Gemini took too long to respond"
        : "Couldn't reach Gemini";
    return { ok: false, reason };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Generates a hook + outline draft from a video's pitch and, when available,
 * this channel's best-performing past videos. Makes a single attempt — the
 * caller (ScriptEditor's "Generate with AI" button) retries by calling this
 * again, since this model fails transiently (a "high demand" 503) on
 * roughly a third of calls.
 */
export async function generateScriptDraft(input: ScriptDraftInput): Promise<DraftResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, reason: "GEMINI_API_KEY isn't configured" };

  return callGemini(apiKey, buildPrompt(input));
}
