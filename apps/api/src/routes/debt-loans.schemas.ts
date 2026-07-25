import * as z from "zod";

export const createDebtLoanSchema = z.object({
  type: z.enum(["DEBT", "LOAN"]),
  wallet_id: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be positive"),
  other_party: z.string().min(1, "Other party is required").max(255).trim(),
  occurred_at: z.coerce.date(),
  note: z.string().max(500).trim().optional(),
});

export const updateDebtLoanSchema = z
  .object({
    note: z.string().max(500).trim().nullable().optional(),
    other_party: z.string().min(1, "Other party is required").max(255).trim().optional(),
    amount: z.coerce.number().positive("Amount must be positive").optional(),
    occurred_at: z.coerce.date().optional(),
  })
  .refine(body => Object.keys(body).length > 0, {
    message: "At least one field is required",
  });

export const listDebtLoansQuerySchema = z.object({
  type: z.enum(["DEBT", "LOAN"]).optional(),
  status: z.enum(["PENDING", "RESOLVED"]).optional(),
  wallet_id: z.string().min(1).optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});
