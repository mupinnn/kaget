import { z } from "zod";
import { APIResponseSchema } from "@/schemas/api.schema";
import {
  SourceTypeSchema,
  SourceOrDestinationSchema,
} from "@/features/records/data/records.schema";

export const TransferTypeSchema = z.enum(["INCOMING", "OUTGOING"]);

export type TransferType = z.infer<typeof TransferTypeSchema>;

/**
 * Snapshot the `source` and `destination` to prevent error and to preserve the history
 * if one of the `source` or `destination` is deleted.
 */
export const TransferSchema = z.object({
  id: z.string().nanoid(),
  ref_id: z.string().nanoid(),
  note: z.string().optional(),
  amount: z.coerce.number({ invalid_type_error: "Amount is required" }).positive(),
  fee: z.coerce.number().nonnegative().optional().default(0),
  source_id: z.string().nanoid(),
  source_type: SourceTypeSchema.refine(v => v, { message: "Source is required" }),
  source: SourceOrDestinationSchema,
  destination_id: z.string().nanoid(),
  destination_type: SourceTypeSchema.refine(v => v, { message: "Destination is required" }),
  destination: SourceOrDestinationSchema,
  type: TransferTypeSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Transfer = z.infer<typeof TransferSchema>;

export const TransfersResponseSchema = APIResponseSchema({
  schema: TransferSchema.array(),
});

export const TransfersRequestQuerySchema = z.object({
  source_id: z.string().nanoid().optional().catch(undefined),
  destination_id: z.string().nanoid().optional().catch(undefined),
});

export type TransfersRequestQuery = z.infer<typeof TransfersRequestQuerySchema>;

export const CreateTransferSchema = TransferSchema.pick({
  note: true,
  amount: true,
  fee: true,
  source: true,
  destination: true,
}).superRefine((data, ctx) => {
  if (data.source && data.source.balance < data.amount) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["amount"],
      message: "Amount should not greater than the source balance",
    });
  }
});

export type CreateTransfer = z.infer<typeof CreateTransferSchema>;

export const CreateTransferResponseSchema = APIResponseSchema({
  schema: TransferSchema,
});

export const ShowTransferResponseSchema = APIResponseSchema({
  schema: TransferSchema,
});
