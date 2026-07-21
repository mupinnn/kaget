import * as z from "zod";

export const budgetCreateItemSchema = z.object({
  name: z.string().min(1, "Budget name is required").max(255).trim(),
  wallet_id: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be positive"),
  budget_type: z.enum(["BUDGET", "GOAL"]).optional().default("BUDGET"),
  initial_contribution: z.coerce
    .number()
    .min(0, "Initial contribution cannot be negative")
    .optional(),
});

export const createBudgetSchema = budgetCreateItemSchema;

export const bulkCreateBudgetSchema = z.object({
  budgets: z.array(budgetCreateItemSchema).min(1, "At least one budget is required"),
});

export const listBudgetsQuerySchema = z.object({
  wallet_id: z.string().min(1).optional(),
  budget_type: z.enum(["BUDGET", "GOAL"]).optional(),
  archived: z
    .enum(["true", "false"])
    .optional()
    .transform(v => (v === undefined ? undefined : v === "true")),
});

export const amountSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
});

export const reactivateBudgetSchema = z
  .object({
    amount: z.coerce.number().positive("Amount must be positive").optional(),
    use_same_amount: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    if (!data.use_same_amount && data.amount === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "Amount is required when use_same_amount is false",
        path: ["amount"],
      });
    }
  });

export const listBudgetRecordsQuerySchema = z.object({
  from_date: z.coerce.date().optional(),
  to_date: z.coerce.date().optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});
