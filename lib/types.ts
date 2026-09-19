import type { CategoryKey } from "@/lib/pipeline";

export type PipelineItem = {
  id: string;
  title: string;
  pitch: string;
  category: CategoryKey;
  status: string;
  dueDate: string | null;
  cost: number;
  editor: string;
  url: string;
  topPick: boolean;
  notes: string;
  steps?: Record<string, boolean>;
  scriptId?: string | null;
};

export type PipelineItemInput = Omit<PipelineItem, "id" | "scriptId">;
