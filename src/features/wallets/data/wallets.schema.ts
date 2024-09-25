import { z } from "zod";

export const WalletSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  digital_balance: z.number(),
  cash_balance: z.number(),
  deleted_at: z.string().datetime().nullable(),
});

export type Wallet = z.infer<typeof WalletSchema>;
