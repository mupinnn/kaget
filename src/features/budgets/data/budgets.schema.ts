import { z } from "zod";
import { APIResponseSchema } from "@/schemas/api.schema";
import { WalletSchema } from "@/features/wallets/data/wallets.schema";

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

export const TransformedBudgetSchema = BudgetSchema.omit({
  balance: true,
  total_balance: true,
}).extend({
  used_balance: BudgetSchema.shape.total_balance,
  used_balance_percentage: z.coerce.number(),
  remaining_balance: BudgetSchema.shape.total_balance,
  remaining_balance_percentage: z.coerce.number(),
  is_deletable: z.boolean(),
});

export type TransformedBudget = z.infer<typeof TransformedBudgetSchema>;

export const BudgetsResponseSchema = APIResponseSchema({
  schema: TransformedBudgetSchema.array(),
});

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

export const CreateBudgetResponseSchema = APIResponseSchema({
  schema: BudgetSchema,
});

export const ShowBudgetResponseSchema = APIResponseSchema({
  schema: TransformedBudgetSchema,
});

export const DeleteBudgetResponseSchema = APIResponseSchema({
  schema: BudgetSchema,
});
