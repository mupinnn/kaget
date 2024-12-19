import { z } from "zod";
import { APIResponseSchema } from "@/schemas/api.schema";
import { WalletSchema } from "@/features/wallets/data/wallets.schema";

export const BudgetSchema = z.object({
  id: z.string().nanoid(),
  name: z.string().trim().min(1, "Budget name is required"),
  balance: z.coerce.number({ invalid_type_error: "Amount is required" }).nonnegative(),
  wallet_id: WalletSchema.shape.id,
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

export type CreateBudget = unknown;

export const CreateBudgetResponseSchema = APIResponseSchema({
  schema: BudgetSchema,
});
