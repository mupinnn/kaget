import { z } from "zod";
import { APIResponseSchema } from "@/schemas/api.schema";

export const RecordSourceTypeSchema = z.enum(["WALLET", "BUDGET", "BUDGET_DETAIL"], {
  message: "Source is required",
});

export type RecordSourceType = z.infer<typeof RecordSourceTypeSchema>;

export const RecordTypeSchema = z.enum(
  ["INCOME", "EXPENSE", "LOAN", "DEBT", "DEBT_REPAYMENT", "DEBT_COLLECTION"],
  { message: "Type is required" }
);

export type RecordType = z.infer<typeof RecordTypeSchema>;

export const RecordSchema = z.object({
  id: z.string().nanoid(),
  note: z.string().min(1, "Note is required").trim(),
  amount: z.coerce.number().positive(),
  source_id: z.string().nanoid(),
  source_type: RecordSourceTypeSchema,
  record_type: RecordTypeSchema,
  recorded_at: z.string().datetime().nullable(),
  created_at: z.string().datetime().nullable(),
  updated_at: z.string().datetime().nullable(),
});

export type Record = z.infer<typeof RecordSchema>;

export const RecordsResponseSchema = APIResponseSchema({
  schema: RecordSchema.array(),
});

export const RecordDetailSchema = RecordSchema.pick({
  id: true,
  note: true,
  amount: true,
  created_at: true,
  updated_at: true,
}).extend({ record_id: RecordSchema.shape.id });

export type RecordDetail = z.infer<typeof RecordDetailSchema>;

export const CreateRecordSchema = RecordSchema.pick({
  note: true,
  amount: true,
  source_id: true,
  record_type: true,
}).extend({
  dor: z.union([z.date(), z.string().datetime()], {
    required_error: "A date of record is required",
  }),
  items: RecordSchema.pick({ note: true, amount: true }).array().optional().default([]),
});

export type CreateRecord = z.infer<typeof CreateRecordSchema>;

export const CreateRecordResponseSchema = APIResponseSchema({
  schema: RecordSchema,
});
