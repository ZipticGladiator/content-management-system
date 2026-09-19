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

export function isLate(dueDate: Date | string | null, isDone: boolean): boolean {
  if (!dueDate || isDone) return false;
  const date = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() < today.getTime();
}
