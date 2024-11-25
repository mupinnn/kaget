import { z } from "zod";
import { APIResponseSchema } from "@/schemas/api.schema";
import { WalletSchema } from "@/features/wallets/data/wallets.schema";

export const BudgetSchema = z.object({
  id: z.string().nanoid(),
  name: z.string().min(1, "Budget name must contain at least 1 character(s)").trim(),
  allocated_digital_balance: z.number(),
  allocated_cash_balance: z.number(),
  created_at: z.string().datetime().nullable(),
  updated_at: z.string().datetime().nullable(),
});

export type Budget = z.infer<typeof BudgetSchema>;

export const BudgetsResponseSchema = APIResponseSchema({
  schema: BudgetSchema.array(),
});

export const BudgetDetailSchema = BudgetSchema.extend({
  budget_id: BudgetSchema.shape.id,
});

export type BudgetDetail = z.infer<typeof BudgetDetailSchema>;

export const WalletBudgetSchema = z.object({
  wallet_id: WalletSchema.shape.id,
  budget_id: BudgetSchema.shape.id,
});

export type WalletBudget = z.infer<typeof WalletBudgetSchema>;
