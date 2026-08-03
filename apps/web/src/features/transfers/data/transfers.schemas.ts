import { z } from "zod";
import type { BudgetWithWallet } from "@/features/budgets/data/budgets.schemas";
import type { SourceType } from "@/features/records/data/records.schemas";
import type { Wallet } from "@/features/wallets/data/wallets.schemas";
import { parseAmount } from "@/utils/amount.util";

export type Transfer = {
  id: string;
  note: string | null;
  amount: number;
  fee: number;
  sourceId: string;
  sourceType: SourceType;
  sourceName: string;
  destinationId: string;
  destinationType: SourceType;
  destinationName: string;
  type: "INCOMING" | "OUTGOING";
  refId: string;
  transferredAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export const TransfersRequestQuerySchema = z.object({
  source_id: z.string().optional(),
  source_type: z.enum(["WALLET", "BUDGET"]).optional(),
});

export type TransfersRequestQuery = z.infer<typeof TransfersRequestQuerySchema>;

export const createTransferSchema = z.object({
  sender_id: z.string().min(1),
  sender_type: z.enum(["WALLET", "BUDGET"]),
  receiver_id: z.string().min(1),
  receiver_type: z.enum(["WALLET", "BUDGET"]),
  amount: z.coerce.number().positive("Amount must be positive"),
  fee: z.coerce.number().min(0, "Fee cannot be negative").optional().default(0),
  note: z.string().max(500).trim().optional(),
  transferred_at: z.coerce.date().optional(),
});

export type CreateTransferInput = z.infer<typeof createTransferSchema>;

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
