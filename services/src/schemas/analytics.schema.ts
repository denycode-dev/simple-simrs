import { z } from "zod";

const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD (contoh: 2026-11-25).")
  .refine((dateStr) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    return (
      utcDate.getUTCFullYear() === year &&
      utcDate.getUTCMonth() === month - 1 &&
      utcDate.getUTCDate() === day
    );
  }, "Tanggal kalender tidak valid.");

/**
 * Supports both `start_date`/`end_date` (React DashboardAnalyticsPage)
 * and `date_from`/`date_to` query parameter conventions.
 */
export const analyticsDateRangeQuerySchema = z
  .object({
    start_date: isoDateSchema.optional(),
    end_date: isoDateSchema.optional(),
    date_from: isoDateSchema.optional(),
    date_to: isoDateSchema.optional(),
  })
  .superRefine((query, ctx) => {
    const start = query.start_date ?? query.date_from;
    const end = query.end_date ?? query.date_to;

    if (start && end && start > end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [query.start_date !== undefined ? "start_date" : "date_from"],
        message: "Tanggal awal periode tidak boleh melebihi tanggal akhir periode.",
      });
    }
  })
  .transform((query) => ({
    startDate: query.start_date ?? query.date_from ?? null,
    endDate: query.end_date ?? query.date_to ?? null,
  }));

export type NormalizedDateRange = z.infer<typeof analyticsDateRangeQuerySchema>;
