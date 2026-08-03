import { z } from "zod";
import type { Wallet } from "@/features/wallets/data/wallets.schemas";
import { parseAmount } from "@/utils/amount.util";

export type Budget = {
  id: string;
  name: string;
  walletId: string;
  balance: number;
  totalBalance: number;
  budgetType: "BUDGET" | "GOAL";
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type BudgetDetail = Budget & {
  usedAmount: number;
  usedPercentage: number;
  isReached: boolean;
};

export type BudgetWithWallet = BudgetDetail & {
  wallet: Wallet;
};

export type BudgetsRequestQuery = {
  limit?: number;
  archived?: boolean;
};

export const CreateBudgetSchema = z.object({
  budgets: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Budget name is required"),
        balance: z.coerce.number().positive("Amount must be positive"),
        wallet: z.custom<Wallet>(),
      })
    )
    .min(1, "At least one budget is required"),
});

export type CreateBudget = z.infer<typeof CreateBudgetSchema>;

export const UpdateBudgetBalanceSchema = z.object({
  balance: z.coerce.number().positive("Balance is required"),
  type: z.enum(["REFUND", "ADD"]),
});

export type UpdateBudgetBalance = z.infer<typeof UpdateBudgetBalanceSchema>;

export const bulkCreateBudgetSchema = z.object({
  budgets: z
    .array(
      z.object({
        name: z.string().min(1, "Budget name is required").max(255).trim(),
        wallet_id: z.string().min(1),
        amount: z.coerce.number().positive("Amount must be positive"),
        budget_type: z.enum(["BUDGET", "GOAL"]).optional().default("BUDGET"),
        initial_contribution: z.coerce
          .number()
          .min(0, "Initial contribution cannot be negative")
          .optional(),
      })
    )
    .min(1, "At least one budget is required"),
});

export function getRemainingBalancePercentage(budget: BudgetDetail) {
  const balance = parseAmount(budget.balance);
  const totalBalance = parseAmount(budget.totalBalance);

  if (totalBalance <= 0) {
    return 0;
  }

  return (balance / totalBalance) * 100;
}
