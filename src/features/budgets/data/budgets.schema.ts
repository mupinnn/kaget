import { z } from "zod";
import { APIResponseSchema } from "@/schemas/api.schema";
import { WalletSchema } from "@/features/wallets/data/wallets.schema";

export const BudgetSchema = z.object({
  id: z.string().nanoid(),
  name: z.string().min(1, "Budget name must contain at least 1 character(s)").trim(),
  allocated_digital_balance: z.coerce.number().nonnegative(),
  allocated_cash_balance: z.coerce.number().nonnegative(),
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
  id: z.string().nanoid(),
  wallet_id: WalletSchema.shape.id,
  budget_id: BudgetSchema.shape.id,
});

export type WalletBudget = z.infer<typeof WalletBudgetSchema>;

const BaseCreateBudgetSchema = BudgetSchema.pick({
  name: true,
  allocated_digital_balance: true,
  allocated_cash_balance: true,
});

export const CreateBudgetSchema = BaseCreateBudgetSchema.extend({
  digital_wallet: WalletSchema.optional(),
  cash_wallet: WalletSchema.optional(),
  items: BaseCreateBudgetSchema.array().optional().default([]),
}).superRefine((data, ctx) => {
  if (data.cash_wallet && data.allocated_cash_balance > data.cash_wallet.balance) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["allocated_cash_balance"],
      message: "Allocated cash balance should not greater than current cash wallet balance",
    });
  }

  if (data.digital_wallet && data.allocated_digital_balance > data.digital_wallet.balance) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["allocated_digital_balance"],
      message: "Allocated digital balance should not greater than current digital wallet balance",
    });
  }
});

export type CreateBudget = z.infer<typeof CreateBudgetSchema>;

export const CreateBudgetResponseSchema = APIResponseSchema({
  schema: BudgetSchema,
});
