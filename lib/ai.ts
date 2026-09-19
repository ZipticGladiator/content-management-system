import "server-only";
import Anthropic from "@anthropic-ai/sdk";

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

/**
 * Generates a hook + outline draft from a video's pitch and, when available,
 * this channel's best-performing past videos. Returns null if no API key is
 * configured or the call fails, so callers can show a friendly fallback
 * instead of a stack trace.
 */
export async function generateScriptDraft(input: ScriptDraftInput): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 800,
      messages: [{ role: "user", content: buildPrompt(input) }],
    });
    const block = message.content.find((b) => b.type === "text");
    return block && block.type === "text" ? block.text.trim() : null;
  } catch {
    return null;
  }
}
