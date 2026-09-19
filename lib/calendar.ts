export type CalendarDay = {
  date: Date;
  iso: string;
  dayOfMonth: number;
  inMonth: boolean;
  isToday: boolean;
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function monthLabel(year: number, monthIndex0: number): string {
  return `${MONTH_NAMES[monthIndex0]} ${year}`;
}

export function parseMonthParam(month: string | undefined): { year: number; monthIndex0: number } {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    return { year: y, monthIndex0: m - 1 };
  }
  const now = new Date();
  return { year: now.getUTCFullYear(), monthIndex0: now.getUTCMonth() };
}

export function monthParam(year: number, monthIndex0: number): string {
  return `${year}-${String(monthIndex0 + 1).padStart(2, "0")}`;
}

export function adjacentMonth(year: number, monthIndex0: number, delta: number) {
  const d = new Date(Date.UTC(year, monthIndex0 + delta, 1));
  return { year: d.getUTCFullYear(), monthIndex0: d.getUTCMonth() };
}

/** Always 6 weeks (42 days), Monday-first, for a stable grid layout. */
export function getMonthGrid(year: number, monthIndex0: number): CalendarDay[] {
  const first = new Date(Date.UTC(year, monthIndex0, 1));
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  const gridStart = new Date(Date.UTC(year, monthIndex0, 1 - mondayOffset));
  const todayIso = new Date().toISOString().slice(0, 10);

  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart.getTime() + i * 86400000);
    const iso = d.toISOString().slice(0, 10);
    days.push({
      date: d,
      iso,
      dayOfMonth: d.getUTCDate(),
      inMonth: d.getUTCMonth() === monthIndex0,
      isToday: iso === todayIso,
    });
  }
  return days;
}
