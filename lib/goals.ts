export const GOAL_PLATFORM_LABELS = {
  YOUTUBE: "YouTube",
  TIKTOK: "TikTok",
} as const;

export type GoalPlatformKey = keyof typeof GOAL_PLATFORM_LABELS;

export const GOAL_PLATFORM_KEYS = Object.keys(GOAL_PLATFORM_LABELS) as GoalPlatformKey[];

export type GoalEntry = {
  id: string;
  platform: GoalPlatformKey;
  label: string;
  target: number;
  manualCurrent: number;
  deadline: string | null;
  liveCurrent: number | null;
};
