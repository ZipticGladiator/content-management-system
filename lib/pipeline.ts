export const CATEGORY_LABELS = {
  SEQUELS: "Sequels",
  DEVSECOPS_CLOUD: "DevSecOps & cloud",
  HANDS_ON: "Hands-on",
  COMMUNITY: "Community",
  SA_INDUSTRY: "SA & industry",
} as const;

export type CategoryKey = keyof typeof CATEGORY_LABELS;

export const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS) as CategoryKey[];

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
