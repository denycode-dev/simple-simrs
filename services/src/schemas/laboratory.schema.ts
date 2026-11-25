import { z } from "zod";

export const labOrderStatusSchema = z.enum([
  "REQUESTED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export const labStatusFlagSchema = z.enum([
  "NORMAL",
  "ABNORMAL",
  "HIGH",
  "LOW",
]);

export type LabOrderStatus = z.infer<typeof labOrderStatusSchema>;
export type LabStatusFlag = z.infer<typeof labStatusFlagSchema>;

const positiveIntField = (fieldLabel: string) =>
  z.coerce
    .number({ invalid_type_error: `${fieldLabel} harus berupa angka.` })
    .int(`${fieldLabel} harus berupa bilangan bulat.`)
    .positive(`${fieldLabel} harus lebih besar dari 0.`);

export const orderIdParamSchema = z.object({
  id: positiveIntField("ID order laboratorium"),
});

export const listLabOrdersQuerySchema = z.object({
  status: z
    .enum(["ALL", "REQUESTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
    .optional(),
  registration_id: positiveIntField("ID pendaftaran").optional(),
  examination_id: positiveIntField("ID pemeriksaan").optional(),
  patient_id: positiveIntField("ID pasien").optional(),
  search: z.string().trim().max(100, "Kata kunci pencarian maksimal 100 karakter.").optional(),
  cursor: positiveIntField("Cursor halaman").optional(),
  limit: z.coerce
    .number({ invalid_type_error: "Batas data (limit) harus berupa angka." })
    .int()
    .min(1, "Limit minimal 1 baris.")
    .max(200, "Limit maksimal 200 baris.")
    .default(100),
});

export type ListLabOrdersQuery = z.infer<typeof listLabOrdersQuerySchema>;

export const createLabOrderItemSchema = z.object({
  test_name: z
    .string({ required_error: "Nama parameter uji wajib diisi." })
    .trim()
    .min(1, "Nama parameter uji wajib diisi.")
    .max(100, "Nama parameter uji maksimal 100 karakter."),
  test_code: z
    .string()
    .trim()
    .min(1, "Kode parameter uji tidak boleh kosong.")
    .max(20, "Kode parameter uji maksimal 20 karakter.")
    .optional(),
  reference_range: z
    .string()
    .trim()
    .max(100, "Rentang nilai rujukan maksimal 100 karakter.")
    .nullish(),
  unit: z.string().trim().max(20, "Satuan uji maksimal 20 karakter.").nullish(),
  tariff: z.coerce
    .number({ invalid_type_error: "Tarif uji laboratorium harus berupa angka." })
    .min(0, "Tarif uji laboratorium tidak boleh bernilai negatif.")
    .max(999_999_999.99, "Tarif uji laboratorium melebihi batas maksimum.")
    .default(50000),
  notes: z.string().trim().max(1000, "Catatan item maksimal 1000 karakter.").nullish(),
});

export const createLabOrderBodySchema = z.object({
  registration_id: positiveIntField("ID pendaftaran kunjungan (registration_id)"),
  examination_id: positiveIntField("ID pemeriksaan dokter (examination_id)").optional(),
  clinical_notes: z
    .string()
    .trim()
    .max(2000, "Catatan indikasi klinis maksimal 2000 karakter.")
    .nullish(),
  items: z
    .array(createLabOrderItemSchema, {
      required_error: "Daftar parameter pemeriksaan laboratorium (items) wajib diisi.",
      invalid_type_error: "Daftar parameter pemeriksaan (items) harus berupa array.",
    })
    .min(1, "Pilih minimal satu parameter pemeriksaan laboratorium.")
    .max(50, "Maksimal 50 parameter pemeriksaan dalam satu order."),
});

export type CreateLabOrderBody = z.infer<typeof createLabOrderBodySchema>;

const rawResultEntrySchema = z
  .object({
    id: z.coerce.number().int().positive().optional(),
    item_id: z.coerce.number().int().positive().optional(),
    result_value: z.preprocess(
      (val) => (val === null || val === undefined ? "" : String(val)),
      z
        .string()
        .trim()
        .min(1, "Nilai hasil pemeriksaan wajib diisi.")
        .max(100, "Nilai hasil pemeriksaan maksimal 100 karakter.")
    ),
    status_flag: labStatusFlagSchema.default("NORMAL"),
    reference_range: z.string().trim().max(100).nullish(),
    unit: z.string().trim().max(20).nullish(),
    notes: z.string().trim().max(1000).nullish(),
  })
  .refine((entry) => entry.id !== undefined || entry.item_id !== undefined, {
    message: "ID item pemeriksaan laboratorium (id atau item_id) wajib diisi.",
    path: ["id"],
  })
  .transform((entry) => ({
    item_id: (entry.id ?? entry.item_id)!,
    result_value: entry.result_value,
    status_flag: entry.status_flag,
    reference_range:
      entry.reference_range && entry.reference_range.length > 0
        ? entry.reference_range
        : null,
    unit: entry.unit && entry.unit.length > 0 ? entry.unit : null,
    notes: entry.notes && entry.notes.length > 0 ? entry.notes : null,
  }));

export type NormalizedLabResultEntry = z.infer<typeof rawResultEntrySchema>;

/**
 * Accepts both frontend `LabResultModal` payload (`{ completed_by, items: [{ id, ... }] }`)
 * and API `results` payload (`{ completed_by, results: [{ item_id, ... }] }`).
 */
export const submitLabResultsBodySchema = z
  .object({
    completed_by: positiveIntField("ID petugas laboratorium (completed_by)").nullish(),
    items: z.array(rawResultEntrySchema).optional(),
    results: z.array(rawResultEntrySchema).optional(),
  })
  .superRefine((body, ctx) => {
    const list = body.items ?? body.results;
    const targetPath = body.results !== undefined && body.items === undefined ? "results" : "items";

    if (!list || list.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [targetPath],
        message: "Daftar hasil pengujian laboratorium wajib disertakan minimal satu item.",
      });
      return;
    }

    const seenIds = new Set<number>();
    for (let i = 0; i < list.length; i += 1) {
      const itemId = list[i].item_id;
      if (seenIds.has(itemId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [targetPath, i, "id"],
          message: `Duplikasi item pengujian dengan ID ${itemId} dalam satu pengiriman.`,
        });
      }
      seenIds.add(itemId);
    }
  })
  .transform((body) => ({
    completed_by: body.completed_by ?? null,
    entries: (body.items ?? body.results)!,
  }));

export type SubmitLabResultsBody = z.infer<typeof submitLabResultsBodySchema>;

export const updateLabOrderStatusBodySchema = z.object({
  status: labOrderStatusSchema,
  notes: z.string().trim().max(500, "Catatan perubahan status maksimal 500 karakter.").nullish(),
});

export type UpdateLabOrderStatusBody = z.infer<typeof updateLabOrderStatusBodySchema>;
