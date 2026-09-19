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
  attachmentCount?: number;
};

export type PipelineItemInput = Omit<
  PipelineItem,
  "id" | "scriptId" | "commentCount" | "attachmentCount"
>;

export type CommentEntry = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

export type AttachmentEntry = {
  id: string;
  label: string;
  url: string;
  createdAt: string;
};
