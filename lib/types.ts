import type { CategoryKey } from "@/lib/pipeline";

export type ItemKind = "youtube" | "tiktok";

export type PipelineItem = {
  id: string;
  title: string;
  pitch: string;
  category: CategoryKey;
  status: string;
  dueDate: string | null;
  cost: number;
  paid: boolean;
  editor: string;
  url: string;
  topPick: boolean;
  notes: string;
  steps?: Record<string, boolean>;
  scriptId?: string | null;
  commentCount?: number;
};

export type PipelineItemInput = Omit<PipelineItem, "id" | "scriptId" | "commentCount">;

export type CommentEntry = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};
