import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { PeriodLog, UserSettings } from "@/shared/types";
import { buildExportCsv, todayStamp } from "@/shared/utils/csv";

export interface ExportResult {
  csvFile: string;
}

export async function exportAllToFiles(
  logs: PeriodLog[],
  settings: UserSettings,
): Promise<ExportResult> {
  if (Platform.OS === "web") {
    throw new Error("Export is not supported on web.");
  }

  const stamp = todayStamp();
  const fileName = `cycle-diary-export-${stamp}.csv`;
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });

  const csv = buildExportCsv(logs, settings);
  file.write(csv);

  return { csvFile: file.uri };
}

export async function shareExportedFiles(
  result: ExportResult,
): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error("Sharing is not available on this device.");
  }
  await Sharing.shareAsync(result.csvFile, {
    mimeType: "text/csv",
    dialogTitle: "Export your Cycle Diary data",
    UTI: "public.comma-separated-values-text",
  });
}
