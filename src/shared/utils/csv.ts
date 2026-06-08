export function buildLogsCsv(logs: import("@/shared/types").PeriodLog[]): string {
  const headers = [
    "date",
    "isPeriod",
    "flow",
    "mood",
    "symptoms",
    "notes",
    "cramp_severity",
    "cramp_location",
    "cramp_notes",
    "sleep_hours",
    "sleep_quality",
    "sleep_notes",
    "craving_type",
    "craving_intensity",
    "craving_notes",
  ];

  const escape = (val: string | number | undefined | null): string => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = logs
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((log) => {
      return [
        log.date,
        log.isPeriod ? "true" : "false",
        log.flow ?? "",
        log.mood ?? "",
        (log.symptoms ?? []).join("; "),
        log.notes ?? "",
        log.cramps?.severity ?? "",
        log.cramps?.location ?? "",
        log.cramps?.notes ?? "",
        log.sleep?.hours ?? "",
        log.sleep?.quality ?? "",
        log.sleep?.notes ?? "",
        log.cravings?.type ?? "",
        log.cravings?.intensity ?? "",
        log.cravings?.notes ?? "",
      ]
        .map(escape)
        .join(",");
    });

  return [headers.join(","), ...rows].join("\n") + "\n";
}

export function buildSettingsJson(
  settings: import("@/shared/types").UserSettings,
): string {
  return JSON.stringify(settings, null, 2);
}

export function buildExportCsv(
  logs: import("@/shared/types").PeriodLog[],
  settings: import("@/shared/types").UserSettings,
): string {
  const stamp = new Date().toISOString();
  const metaLines = [
    `# Cycle Diary Export`,
    `# Generated: ${stamp}`,
    `#`,
    `# User Settings`,
    `# cycleLength=${settings.cycleLength}`,
    `# periodLength=${settings.periodLength}`,
    `# lastPeriodStart=${settings.lastPeriodStart ?? ""}`,
    `# notificationsEnabled=${settings.notificationsEnabled}`,
    `# notifyBeforeDays=${settings.notifyBeforeDays}`,
    `# notifyTime=${settings.notifyTime}`,
    `# symptomTracking=${settings.symptomTracking}`,
    `# flowTracking=${settings.flowTracking}`,
    `# onboardingComplete=${settings.onboardingComplete}`,
    `# hasSeenStorageNotice=${settings.hasSeenStorageNotice}`,
    ``,
  ];
  return metaLines.join("\n") + buildLogsCsv(logs);
}

export function todayStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}
