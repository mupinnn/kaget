import { z } from "zod";
import { APIResponseSchema } from "@/schemas/api.schema";
import { WalletSchema } from "@/features/wallets/data/wallets.schema";
import { BudgetSchema, BudgetItemSchema } from "@/features/budgets/data/budgets.schema";

export const SourceTypeSchema = z.enum(["WALLET", "BUDGET", "BUDGET_ITEM"]);

export type SourceType = z.infer<typeof SourceTypeSchema>;

export const SourceOrDestinationSchema = z.union([WalletSchema, BudgetSchema, BudgetItemSchema]);

export type SourceOrDestination = z.infer<typeof SourceOrDestinationSchema>;

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
  source_type: SourceTypeSchema.refine(v => v, { message: "Source is required" }),
  record_type: RecordTypeSchema,
  recorded_at: z.string().datetime(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Record = z.infer<typeof RecordSchema>;

export const RecordWithRelationsSchema = RecordSchema.extend({
  source: SourceOrDestinationSchema,
});

export type RecordWithRelations = z.infer<typeof RecordWithRelationsSchema>;

export const RecordsResponseSchema = APIResponseSchema({
  schema: RecordWithRelationsSchema.array(),
});

export const RecordsRequestQuerySchema = z.object({
  start: z.string().date().optional().catch(undefined),
  end: z.string().date().optional().catch(undefined),
  source_id: z.string().nanoid().optional().catch(undefined),
});

export type RecordsRequestQuery = z.infer<typeof RecordsRequestQuerySchema>;

export const RecordItemSchema = RecordSchema.pick({
  id: true,
  note: true,
  amount: true,
  created_at: true,
  updated_at: true,
}).extend({ record_id: RecordSchema.shape.id });

export type RecordItem = z.infer<typeof RecordItemSchema>;

export const CreateRecordSchema = RecordSchema.pick({
  note: true,
  amount: true,
  record_type: true,
})
  .extend({
    source: SourceOrDestinationSchema,
    dor: z.union([z.date(), z.string().datetime()], {
      required_error: "A date of record is required",
    }),
    items: RecordItemSchema.pick({ note: true, amount: true }).array().optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (data.record_type === "EXPENSE" && data.source && data.source.balance < data.amount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["amount"],
        message: "Amount should not greater than the selected source balance",
      });
    }
  });

export type CreateRecord = z.infer<typeof CreateRecordSchema>;

export const CreateRecordResponseSchema = APIResponseSchema({
  schema: RecordSchema,
});

export const ShowRecordResponseSchema = APIResponseSchema({
  schema: RecordWithRelationsSchema,
});

export const ShowRecordItemsResponseSchema = APIResponseSchema({
  schema: RecordItemSchema.array().default([]),
});

export const DeleteRecordResponseSchema = APIResponseSchema({
  schema: RecordSchema,
});
