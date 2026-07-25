import * as z from "zod";

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

export const listTransfersQuerySchema = z.object({
  account_id: z.string().min(1).optional(),
  account_type: z.enum(["WALLET", "BUDGET"]).optional(),
  type: z.enum(["INCOMING", "OUTGOING"]).optional(),
  from_date: z.coerce.date().optional(),
  to_date: z.coerce.date().optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});
