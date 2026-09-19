export const GOAL_PLATFORM_LABELS = {
  YOUTUBE: "YouTube",
  TIKTOK: "TikTok",
} as const;

export type GoalPlatformKey = keyof typeof GOAL_PLATFORM_LABELS;

export const GOAL_PLATFORM_KEYS = Object.keys(GOAL_PLATFORM_LABELS) as GoalPlatformKey[];

export type GoalSnapshotPoint = {
  value: number;
  at: string;
};

export type GoalEntry = {
  id: string;
  platform: GoalPlatformKey;
  label: string;
  target: number;
  manualCurrent: number;
  deadline: string | null;
  liveCurrent: number | null;
  history: GoalSnapshotPoint[];
};

export type Pace = {
  label: string;
  tone: "good" | "warn" | "danger" | "neutral";
};

export function computePace(history: GoalSnapshotPoint[], target: number, deadline: string | null): Pace {
  if (history.length < 2) {
    return { label: "Gathering history…", tone: "neutral" };
  }

  const first = history[0];
  const last = history[history.length - 1];
  const current = last.value;

  if (current >= target) {
    return { label: "Goal reached", tone: "good" };
  }

  const days = Math.max(1, (new Date(last.at).getTime() - new Date(first.at).getTime()) / 86400000);
  const rate = (last.value - first.value) / days;

  if (rate <= 0) {
    return { label: "No growth yet", tone: "warn" };
  }

  const daysNeeded = (target - current) / rate;
  const projected = new Date(Date.now() + daysNeeded * 86400000);

  if (!deadline) {
    return {
      label: `~${projected.toLocaleDateString("en-ZA", { day: "numeric", month: "short" })} at this pace`,
      tone: "neutral",
    };
  }

  return projected.getTime() <= new Date(deadline).getTime()
    ? { label: "On pace", tone: "good" }
    : { label: "Behind pace", tone: "danger" };
}
