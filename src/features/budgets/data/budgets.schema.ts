import { z } from "zod";
import { WalletSchema } from "@/features/wallets/data/wallets.schema";

export const BudgetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  allocated_digital_balance: z.number().positive(),
  allocated_cash_balance: z.number().positive(),
  remaining_balance: z.number().positive(),
  wallet_id: WalletSchema.shape.id,
  deleted_at: z.string().datetime(),
});

export type Budget = z.infer<typeof BudgetSchema>;

export const BudgetDetailSchema = BudgetSchema.omit({ wallet_id: true }).merge(
  z.object({ budget_id: BudgetSchema.shape.id })
);

export type BudgetDetail = z.infer<typeof BudgetDetailSchema>;

export const WalletBudgetSchema = z.object({
  wallet_id: WalletSchema.shape.id,
  budget_id: BudgetSchema.shape.id,
});
