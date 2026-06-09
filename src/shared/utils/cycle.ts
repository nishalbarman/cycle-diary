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

export function getPhase(
  cycleDay: number,
  periodLength: number,
  cycleLength: number,
): string {
  if (cycleDay <= 0) return "New Cycle";
  if (cycleDay <= periodLength) return "Period";
  if (cycleDay > cycleLength) return "Extended";
  if (cycleDay <= cycleLength - 16) return "Follicular";
  if (cycleDay >= cycleLength - 15 && cycleDay <= cycleLength - 13)
    return "Ovulation";
  return "Luteal";
}

export function predictNextPeriod(
  logs: PeriodLog[],
  settings: UserSettings,
): { start: Date; end: Date } | null {
  const stats = computeCycleLengthStats(logs);
  const effectiveCycleLength = stats.average > 0 ? stats.average : settings.cycleLength;

  const periodStarts = logs
    .filter((l) => l.isPeriod)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (periodStarts.length === 0 && !settings.lastPeriodStart) return null;

  const lastStart = settings.lastPeriodStart
    ? parseDate(settings.lastPeriodStart)
    : parseDate(periodStarts[periodStarts.length - 1].date);

  const predictedStart = addDays(lastStart, effectiveCycleLength);
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

export interface PeriodGroup {
  start: string;
  end: string;
  periodLength: number;
  logs: PeriodLog[];
}

export function buildPeriodGroups(logs: PeriodLog[]): PeriodGroup[] {
  const sorted = logs
    .filter((l) => l.isPeriod)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) return [];

  const groups: PeriodGroup[] = [];
  let current: PeriodLog[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const diff = daysBetween(
      parseDate(sorted[i - 1].date),
      parseDate(sorted[i].date),
    );
    if (Math.abs(diff) > 1) {
      groups.push({
        start: current[0].date,
        end: current[current.length - 1].date,
        periodLength: current.length,
        logs: current,
      });
      current = [sorted[i]];
    } else {
      current.push(sorted[i]);
    }
  }
  if (current.length > 0) {
    groups.push({
      start: current[0].date,
      end: current[current.length - 1].date,
      periodLength: current.length,
      logs: current,
    });
  }
  return groups;
}

export interface CompletedCycle {
  startDate: string;
  endDate: string;
  length: number;
  periodLength: number;
}

export function getCompletedCycles(logs: PeriodLog[]): CompletedCycle[] {
  const groups = buildPeriodGroups(logs);
  const cycles: CompletedCycle[] = [];
  for (let i = 1; i < groups.length; i++) {
    const prev = groups[i - 1];
    const curr = groups[i];
    const length = daysBetween(parseDate(prev.start), parseDate(curr.start));
    cycles.push({
      startDate: prev.start,
      endDate: formatDate(addDays(parseDate(curr.start), -1)),
      length,
      periodLength: prev.periodLength,
    });
  }
  return cycles;
}

export function computeCycleLengthStats(
  logs: PeriodLog[],
): { average: number; count: number; observed: number[] } {
  const groups = buildPeriodGroups(logs);
  const observed: number[] = [];
  for (let i = 1; i < groups.length; i++) {
    const len = daysBetween(parseDate(groups[i - 1].start), parseDate(groups[i].start));
    observed.push(len);
  }
  return {
    average: observed.length > 0 ? average(observed) : 0,
    count: observed.length,
    observed,
  };
}

export function isNewPeriodGroup(
  logDate: string,
  existingLogs: PeriodLog[],
): boolean {
  const periodDates = existingLogs
    .filter((l) => l.isPeriod)
    .map((l) => l.date)
    .sort();
  if (periodDates.length === 0) return true;
  const parsed = parseDate(logDate);
  const dayBefore = formatDate(addDays(parsed, -1));
  const dayAfter = formatDate(addDays(parsed, 1));
  return !periodDates.includes(dayBefore) && !periodDates.includes(dayAfter);
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
