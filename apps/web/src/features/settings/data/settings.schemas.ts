import { BudgetItemSchema, BudgetSchema } from "@/features/budgets/data/budgets.schemas";
import { RecordItemSchema, RecordSchema } from "@/features/records/data/records.schemas";
import { TransferSchema } from "@/features/transfers/data/transfers.schemas";
import { WalletSchema } from "@/features/wallets/data/wallets.schemas";
import { z } from "zod";

export const SettingsSchema = z.object({
  currency: z.string({ required_error: "Currency is required" }),
});

export type Settings = z.infer<typeof SettingsSchema>;

export const ImportSchema = z.array(
  z.object({
    table: z.string(),
    rows: z.union([
      WalletSchema.array(),
      BudgetSchema.array(),
      BudgetItemSchema.array(),
      RecordSchema.array(),
      RecordItemSchema.array(),
      TransferSchema.array(),
      SettingsSchema.array(),
    ]),
  })
);
