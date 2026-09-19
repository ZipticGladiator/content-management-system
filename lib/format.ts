export function rand(n: number): string {
  return "R " + (Number(n) || 0).toLocaleString("en-ZA", { maximumFractionDigits: 0 });
}

export function fmtDate(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

export function toDateInputValue(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

export function timeAgo(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return fmtDate(date);
}

export function formatCount(n: number): string {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(num % 1_000 === 0 ? 0 : 1)}K`;
  return num.toLocaleString();
}

export function isLate(dueDate: Date | string | null, isDone: boolean): boolean {
  if (!dueDate || isDone) return false;
  const date = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() < today.getTime();
}
