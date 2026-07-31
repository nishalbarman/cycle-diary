import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
import { wmSchema } from "./schema";
import { PeriodLogModel, UserSettingsModel } from "./models";

const adapter = new SQLiteAdapter({
  schema: wmSchema,
  dbName: "periods_tracker",
  jsi: true,
  onSetUpError: (error) => {
    console.error("[wm] database setup error:", error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [PeriodLogModel, UserSettingsModel],
});
