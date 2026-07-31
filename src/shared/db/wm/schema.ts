import { appSchema, tableSchema } from "@nozbe/watermelondb";

export const wmSchema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: "period_logs",
      columns: [
        { name: "date", type: "string", isIndexed: true },
        { name: "flow", type: "string", isOptional: true },
        { name: "symptoms", type: "string" },
        { name: "mood", type: "string", isOptional: true },
        { name: "notes", type: "string", isOptional: true },
        { name: "is_period", type: "boolean" },
        { name: "cramps", type: "string", isOptional: true },
        { name: "cravings", type: "string", isOptional: true },
        { name: "sleep", type: "string", isOptional: true },
        { name: "water", type: "number" },
      ],
    }),
    tableSchema({
      name: "user_settings",
      columns: [
        { name: "cycle_length", type: "number" },
        { name: "period_length", type: "number" },
        { name: "last_period_start", type: "string", isOptional: true },
        { name: "primary_goal", type: "string", isOptional: true },
        { name: "notifications_enabled", type: "boolean" },
        { name: "notify_before_days", type: "number" },
        { name: "notify_time", type: "string" },
        { name: "ovulation_reminder_enabled", type: "boolean" },
        { name: "pill_reminder_enabled", type: "boolean" },
        { name: "pill_notify_time", type: "string" },
        { name: "symptom_tracking", type: "boolean" },
        { name: "flow_tracking", type: "boolean" },
        { name: "onboarding_complete", type: "boolean" },
        { name: "has_seen_storage_notice", type: "boolean" },
      ],
    }),
  ],
});
