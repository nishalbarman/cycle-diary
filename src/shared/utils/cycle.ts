import { PeriodLog, UserSettings } from "@/shared/types";

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round(
    (new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime() -
      new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()) /
      86400000,
  );
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function getMonthDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: Date[] = [];
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

export function getWeekdayLabels(): string[] {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
}

export function predictNextPeriod(
  logs: PeriodLog[],
  settings: UserSettings,
): { start: Date; end: Date } | null {
  const periodStarts = logs
    .filter((l) => l.isPeriod)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (periodStarts.length === 0 && !settings.lastPeriodStart) return null;

  const lastStart = settings.lastPeriodStart
    ? parseDate(settings.lastPeriodStart)
    : parseDate(periodStarts[periodStarts.length - 1].date);

  const predictedStart = addDays(lastStart, settings.cycleLength);
  const predictedEnd = addDays(predictedStart, settings.periodLength - 1);
  return { start: predictedStart, end: predictedEnd };
}

export function isInRange(
  date: Date,
  start: Date,
  end: Date,
): boolean {
  const t = date.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

export function getFertileWindow(
  periodStart: Date,
  cycleLength: number,
): { start: Date; end: Date } {
  const ovulationDay = cycleLength - 14;
  const start = addDays(periodStart, ovulationDay - 5);
  const end = addDays(periodStart, ovulationDay + 1);
  return { start, end };
}

export function getFormattedDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export interface CompletedCycle {
  startDate: string;
  endDate: string;
  length: number;
  periodLength: number;
}

export function getCompletedCycles(logs: PeriodLog[]): CompletedCycle[] {
  const sorted = logs
    .filter((l) => l.isPeriod)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) return [];

  const groups: PeriodLog[][] = [];
  let current: PeriodLog[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const diff = daysBetween(
      parseDate(sorted[i - 1].date),
      parseDate(sorted[i].date),
    );
    if (Math.abs(diff) > 1) {
      groups.push(current);
      current = [sorted[i]];
    } else {
      current.push(sorted[i]);
    }
  }
  if (current.length > 0) groups.push(current);

  const cycles: CompletedCycle[] = [];
  for (let i = 1; i < groups.length; i++) {
    const prev = groups[i - 1];
    const curr = groups[i];
    const start = prev[0].date;
    const end = curr[curr.length - 1].date;
    const length = daysBetween(parseDate(start), parseDate(end));
    const periodLength = curr.length;
    cycles.push({ startDate: start, endDate: end, length, periodLength });
  }
  return cycles;
}

export function getSymptomFrequency(
  logs: PeriodLog[],
): { symptom: string; count: number }[] {
  const map = new Map<string, number>();
  for (const l of logs) {
    for (const s of l.symptoms) {
      map.set(s, (map.get(s) ?? 0) + 1);
    }
  }
  return Array.from(map.entries())
    .map(([symptom, count]) => ({ symptom, count }))
    .sort((a, b) => b.count - a.count);
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}
