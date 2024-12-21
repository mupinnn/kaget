import { z } from "zod";
import { APIResponseSchema } from "@/schemas/api.schema";
import { WalletSchema } from "@/features/wallets/data/wallets.schema";

export const BudgetSchema = z.object({
  id: z.string().nanoid(),
  name: z.string().trim().min(1, "Budget name is required"),
  balance: z.coerce.number({ invalid_type_error: "Balance is required" }).nonnegative(),
  wallet_id: WalletSchema.shape.id.optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Budget = z.infer<typeof BudgetSchema>;

export const BudgetsResponseSchema = APIResponseSchema({
  schema: BudgetSchema.array(),
});

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
        items: z
          .array(
            BudgetItemSchema.pick({
              name: true,
              balance: true,
            }).extend({ wallet: WalletSchema })
          )
          .optional(),
      })
    )
    .superRefine((data, ctx) => {
      const uniqueName = new Set<string>();
      const walletBalances: Record<string, number> = {};

      for (const [index, budget] of data.entries()) {
        const lowerCaseBudgetName = budget.name.toLowerCase();

        if (uniqueName.has(lowerCaseBudgetName)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Duplicate budget name are not allowed",
            path: [index, "name"],
          });
        } else {
          uniqueName.add(lowerCaseBudgetName);
        }

        walletBalances[budget.wallet.id] = (walletBalances[budget.wallet.id] || 0) + budget.balance;

        if (walletBalances[budget.wallet.id] > budget.wallet.balance) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `The total budgeted balance using wallet "${budget.wallet.name}" exceeds the remaining balance of "${budget.wallet.name} itself`,
            path: [index, "balance"],
          });
        }
      }
    }),
});
export type CreateBudget = z.infer<typeof CreateBudgetSchema>;

export const CreateBudgetResponseSchema = APIResponseSchema({
  schema: BudgetSchema,
});
