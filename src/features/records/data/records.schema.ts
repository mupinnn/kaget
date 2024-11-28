import { z } from "zod";
import { APIResponseSchema } from "@/schemas/api.schema";
import { WalletSchema } from "@/features/wallets/data/wallets.schema";

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
  amount: z.coerce.number({ invalid_type_error: "Amount is required" }).positive(),
  source_id: z.string().nanoid(),
  source_type: RecordSourceTypeSchema,
  record_type: RecordTypeSchema,
  recorded_at: z.string().datetime(),
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
  record_type: true,
})
  .extend({
    wallet: WalletSchema,
    dor: z.union([z.date(), z.string().datetime()], {
      required_error: "A date of record is required",
    }),
    items: RecordDetailSchema.pick({ note: true, amount: true }).array().optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (data.wallet && data.wallet.balance < data.amount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["amount"],
        message: "Amount should not greater than the selected wallet balance",
      });
    }
  });

export type CreateRecord = z.infer<typeof CreateRecordSchema>;

export const CreateRecordResponseSchema = APIResponseSchema({
  schema: RecordSchema,
});
