import * as z from "zod";

export const createWalletSchema = z.object({
  name: z.string().min(1, "Wallet name is required").max(255).trim(),
  type: z.enum(["CASH", "DIGITAL"]),
  initial_balance: z.coerce
    .number()
    .min(0, "Initial balance must be non-negative")
    .optional()
    .default(0),
});

export const updateWalletSchema = z.object({
  name: z.string().min(1, "Wallet name is required").max(255).trim(),
});
