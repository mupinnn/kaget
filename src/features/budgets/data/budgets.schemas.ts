import { z } from "zod";
import { WalletSchema } from "@/features/wallets/data/wallets.schemas";

export const BudgetSchema = z.object({
  id: z.string().nanoid(),
  name: z.string().trim().min(1, "Budget name is required"),
  balance: z.coerce.number({ invalid_type_error: "Balance is required" }).nonnegative(),
  total_balance: z.coerce.number().nonnegative(),
  wallet_id: WalletSchema.shape.id,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  archived_at: z.string().datetime().nullable(),
});

export type Budget = z.infer<typeof BudgetSchema>;

export const TransformedBudgetWithRelationsSchema = BudgetSchema.omit({
  balance: true,
  total_balance: true,
}).extend({
  used_balance: BudgetSchema.shape.total_balance,
  used_balance_percentage: z.coerce.number(),
  remaining_balance: BudgetSchema.shape.total_balance,
  remaining_balance_percentage: z.coerce.number(),
  wallet: WalletSchema,
});

export type TransformedBudgetWithRelations = z.infer<typeof TransformedBudgetWithRelationsSchema>;

export const BudgetsRequestQuerySchema = z.object({
  limit: z.coerce.number().positive().optional().catch(undefined),
});

export type BudgetsRequestQuery = z.infer<typeof BudgetsRequestQuerySchema>;

export const BudgetItemSchema = BudgetSchema.extend({
  budget_id: BudgetSchema.shape.id,
});

export type BudgetItem = z.infer<typeof BudgetItemSchema>;

export const CreateBudgetSchema = z.object({
  budgets: z
    .array(
      BudgetSchema.pick({ name: true }).extend({
        balance: BudgetSchema.shape.balance.positive(),
        wallet: WalletSchema,
      })
    )
    .superRefine((budgets, ctx) => {
      const uniqueName = new Set<string>();
      const walletBalances: Record<string, number> = {};

      for (const [i, budget] of budgets.entries()) {
        const lowerCasedBudgetName = budget.name.toLowerCase();

        if (uniqueName.has(lowerCasedBudgetName)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Duplicate budget name are not allowed",
            path: [i, "name"],
          });
        } else {
          uniqueName.add(lowerCasedBudgetName);
        }

        walletBalances[budget.wallet.id] = (walletBalances[budget.wallet.id] || 0) + budget.balance;

        if (walletBalances[budget.wallet.id] > budget.wallet.balance) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `The total budgeted balance using wallet "${budget.wallet.name}" exceeds the remaining balance of "${budget.wallet.name}" itself`,
            path: [i, "balance"],
          });
        }
      }
    }),
});
export type CreateBudget = z.infer<typeof CreateBudgetSchema>;

export const UpdateBudgetBalanceSchema = BudgetSchema.pick({ balance: true }).extend({
  type: z.enum(["REFUND", "ADD"]),
});

export type UpdateBudgetBalance = z.infer<typeof UpdateBudgetBalanceSchema>;
