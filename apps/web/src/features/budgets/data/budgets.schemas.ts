import { bulkCreateBudgetSchema } from "@kaget/api/schemas";
import type { InferResponseType } from "hono/client";
import { z } from "zod";
import type { Wallet } from "@/features/wallets/data/wallets.schemas";
import { api } from "@/libs/api.lib";
import { parseAmount } from "@/utils/amount.util";

export type BudgetDetail = InferResponseType<(typeof api.api.budgets)[":id"]["$get"], 200>["data"];

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
  balance: z.coerce.number({ invalid_type_error: "Balance is required" }).positive(),
  type: z.enum(["REFUND", "ADD"]),
});

export type UpdateBudgetBalance = z.infer<typeof UpdateBudgetBalanceSchema>;

export { bulkCreateBudgetSchema };

export function getRemainingBalancePercentage(budget: BudgetDetail) {
  const balance = parseAmount(budget.balance);
  const totalBalance = parseAmount(budget.totalBalance);

  if (totalBalance <= 0) {
    return 0;
  }

  return (balance / totalBalance) * 100;
}
