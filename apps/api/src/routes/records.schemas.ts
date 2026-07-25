import * as z from "zod";

export const recordItemInputSchema = z.object({
  note: z.string().max(500).trim().optional(),
  amount: z.coerce.number().positive("Item amount must be positive"),
});

export const createRecordSchema = z
  .object({
    source_id: z.string().min(1),
    source_type: z.enum(["WALLET", "BUDGET"]),
    record_type: z.enum(["INCOME", "EXPENSE"], {
      message: "Record type must be INCOME or EXPENSE",
    }),
    recorded_at: z.coerce.date(),
    note: z.string().max(500).trim().optional(),
    items: z.array(recordItemInputSchema).min(1, "At least one item is required"),
  })
  .superRefine((data, ctx) => {
    if (data.source_type === "BUDGET" && data.record_type !== "EXPENSE") {
      ctx.addIssue({
        code: "custom",
        message: "Budget records must be EXPENSE",
        path: ["record_type"],
      });
    }
  });

export const updateRecordItemSchema = recordItemInputSchema.extend({
  id: z.string().min(1).optional(),
});

export const updateRecordSchema = z
  .object({
    note: z.string().max(500).trim().optional(),
    record_type: z.enum(["INCOME", "EXPENSE"]).optional(),
    source_id: z.string().min(1).optional(),
    recorded_at: z.coerce.date().optional(),
    items: z.array(updateRecordItemSchema).min(1, "At least one item is required").optional(),
  })
  .refine(body => Object.keys(body).length > 0, {
    message: "At least one field is required",
  });

export const listRecordsQuerySchema = z.object({
  source_id: z.string().min(1).optional(),
  record_type: z.enum(["INCOME", "EXPENSE"]).optional(),
  from_date: z.coerce.date().optional(),
  to_date: z.coerce.date().optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});
