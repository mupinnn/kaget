import { z } from "zod";
import { BudgetItemSchema, BudgetSchema } from "@/features/budgets/data/budgets.schema";
import { WalletSchema } from "@/features/wallets/data/wallets.schema";
import { APIResponseSchema } from "@/schemas/api.schema";

export const TransferSourceDestinationTypeSchema = z.enum(["WALLET", "BUDGET", "BUDGET_DETAIL"]);

export type TransferSourceDestinationType = z.infer<typeof TransferSourceDestinationTypeSchema>;

export const TransferSchema = z.object({
  id: z.string().nanoid(),
  note: z.string().optional(),
  amount: z.coerce.number({ invalid_type_error: "Amount is required" }).positive(),
  source_id: z.string().nanoid(),
  destination_id: z.string().nanoid(),
  destination_type: TransferSourceDestinationTypeSchema.refine(val => val, {
    message: "Destination is required",
  }),
  source_type: TransferSourceDestinationTypeSchema.refine(val => val, {
    message: "Source is required",
  }),
  created_at: z.string().datetime().nullable(),
  updated_at: z.string().datetime().nullable(),
});

export type Transfer = z.infer<typeof TransferSchema>;

export const TransferWithRelationsSchema = TransferSchema.extend({
  destination: z.union([WalletSchema, BudgetSchema, BudgetItemSchema]),
  source: z.union([WalletSchema, BudgetSchema, BudgetItemSchema]),
});

export type TransferWithRelations = z.infer<typeof TransferWithRelationsSchema>;

export const TransfersResponseSchema = APIResponseSchema({
  schema: TransferWithRelationsSchema.array(),
});

export const TransfersRequestQuerySchema = z.object({
  source_id: z.string().nanoid().optional().catch(undefined),
  destination_id: z.string().nanoid().optional().catch(undefined),
});

export type TransfersRequestQuery = z.infer<typeof TransfersRequestQuerySchema>;

export const CreateTransferSchema = TransferSchema.pick({
  note: true,
  amount: true,
})
  .extend({
    source: WalletSchema,
    destination: WalletSchema,
  })
  .superRefine((data, ctx) => {
    if (data.source && data.source.balance < data.amount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["amount"],
        message: "Amount should not greater than the selected wallet balance",
      });
    }
  });

export type CreateTransfer = z.infer<typeof CreateTransferSchema>;

export const CreateTransferResponseSchema = APIResponseSchema({
  schema: TransferSchema,
});
