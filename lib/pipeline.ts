/** A per-org, user-editable category (replaces the old fixed Educational/Technical/Lifestyle enum). */
export type CategoryOption = { key: string; label: string };

export function categoryLabel(categories: readonly CategoryOption[], key: string): string {
  return categories.find((c) => c.key === key)?.label ?? key;
}

export const YOUTUBE_STAGES = [
  ["IDEA", "Idea", "--s-idea"],
  ["SCRIPT", "Scripting", "--s-script"],
  ["FILM", "Filming", "--s-film"],
  ["EDIT", "Editing", "--s-edit"],
  ["SCHEDULED", "Scheduled", "--s-sched"],
  ["PUBLISHED", "Published", "--s-pub"],
] as const;

export const TIKTOK_STAGES = [
  ["IDEA", "Idea", "--s-idea"],
  ["SCRIPT", "Script", "--s-script"],
  ["FILM", "Film", "--s-film"],
  ["EDIT", "Edit", "--s-edit"],
  ["POSTED", "Posted", "--s-posted"],
] as const;

export type StageDef = readonly [string, string, string];

export const YOUTUBE_STEPS = [
  ["stepScript", "Script"],
  ["stepFilm", "Film"],
  ["stepEdit", "Edit"],
  ["stepThumbnail", "Thumbnail"],
  ["stepUpload", "Upload"],
] as const;

export function stageLabel(stages: readonly StageDef[], key: string): string {
  return stages.find((s) => s[0] === key)?.[1] ?? key;
}

export function stageColorVar(stages: readonly StageDef[], key: string): string {
  return stages.find((s) => s[0] === key)?.[2] ?? "--line";
}
