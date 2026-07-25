import { createTransferSchema } from "@kaget/api/schemas";
import type { InferResponseType } from "hono/client";
import { z } from "zod";
import type { BudgetWithWallet } from "@/features/budgets/data/budgets.schemas";
import type { Wallet } from "@/features/wallets/data/wallets.schemas";
import { api } from "@/libs/api.lib";
import { parseAmount } from "@/utils/amount.util";

export type Transfer = InferResponseType<
  typeof api.api.transfers.$get,
  200
>["data"]["transfers"][number];

export const TransfersRequestQuerySchema = z.object({
  source_id: z.string().optional(),
  source_type: z.enum(["WALLET", "BUDGET"]).optional(),
});

export type TransfersRequestQuery = z.infer<typeof TransfersRequestQuerySchema>;

export const CreateTransferFormSchema = z
  .object({
    note: z.string().trim().optional(),
    amount: z.coerce.number().positive("Amount must be positive"),
    fee: z.coerce.number().min(0).optional().default(0),
    source: z.custom<Wallet | BudgetWithWallet>(),
    destination: z.custom<Wallet | BudgetWithWallet>(),
  })
  .superRefine((data, ctx) => {
    if (data.source && parseAmount(data.source.balance) < data.amount) {
      ctx.addIssue({
        code: "custom",
        path: ["amount"],
        message: "Amount should not be greater than the selected source balance",
      });
    }
  });

export type CreateTransferForm = z.infer<typeof CreateTransferFormSchema>;

export { createTransferSchema };

export type CreateTransferInput = z.infer<typeof createTransferSchema>;

function getAccountType(account: Wallet | BudgetWithWallet): "WALLET" | "BUDGET" {
  return "walletId" in account ? "BUDGET" : "WALLET";
}

export function toCreateTransferInput(form: CreateTransferForm): CreateTransferInput {
  return {
    sender_id: form.source.id,
    sender_type: getAccountType(form.source),
    receiver_id: form.destination.id,
    receiver_type: getAccountType(form.destination),
    amount: form.amount,
    fee: form.fee,
    note: form.note,
  };
}
