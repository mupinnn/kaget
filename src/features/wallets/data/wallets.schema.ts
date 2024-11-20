import { z } from "zod";

export const WalletTypeSchema = z.enum(["CASH", "DIGITAL"], { message: "Wallet type is required" });
export type WalletType = z.infer<typeof WalletTypeSchema>;

export const WalletSchema = z.object({
  id: z.string().nanoid(),
  name: z.string().min(1, "Wallet name must contain at least 1 character(s)"),
  balance: z.number(),
  type: WalletTypeSchema,
  created_at: z.string().datetime().nullable(),
  updated_at: z.string().datetime().nullable(),
});
export type Wallet = z.infer<typeof WalletSchema>;

export const CreateWalletSchema = z
  .object({
    initial_balance: z.coerce.number().min(0, "Initial balance must be greater than or equal to 0"),
  })
  .merge(WalletSchema.pick({ name: true, type: true }));
export type CreateWallet = z.infer<typeof CreateWalletSchema>;
