export const PLATFORM_LABELS = {
  YOUTUBE: "YouTube",
  TIKTOK: "TikTok",
  OTHER: "Other",
} as const;

export const TYPE_LABELS = {
  COMPETITOR: "Competitor",
  INSPIRATION: "Inspiration",
} as const;

export type PlatformKey = keyof typeof PLATFORM_LABELS;
export type TypeKey = keyof typeof TYPE_LABELS;

export const PLATFORM_KEYS = Object.keys(PLATFORM_LABELS) as PlatformKey[];
export const TYPE_KEYS = Object.keys(TYPE_LABELS) as TypeKey[];

export type InspirationEntry = {
  id: string;
  name: string;
  platform: PlatformKey;
  type: TypeKey;
  url: string;
  followers: number;
  description: string;
};
