import { z } from "zod";
import { APIResponseSchema } from "@/schemas/api.schema";

export const WalletTypeSchema = z.enum(["CASH", "DIGITAL"], { message: "Wallet type is required" });

export type WalletType = z.infer<typeof WalletTypeSchema>;

export const WalletSchema = z.object({
  id: z.string().nanoid(),
  name: z.string().min(1, "Wallet name must contain at least 1 character(s)").trim(),
  balance: z.number(),
  type: WalletTypeSchema,
  created_at: z.string().datetime().nullable(),
  updated_at: z.string().datetime().nullable(),
});

export type Wallet = z.infer<typeof WalletSchema>;

export const WalletsResponseSchema = APIResponseSchema({
  schema: WalletSchema.array(),
});

export const WalletsRequestQuerySchema = z.object({
  type: WalletSchema.shape.type.optional().catch(undefined),
});

export type WalletsRequestQuery = z.infer<typeof WalletsRequestQuerySchema>;

export const CreateWalletSchema = z
  .object({
    initial_balance: z.coerce.number().min(0, "Initial balance must be greater than or equal to 0"),
  })
  .merge(WalletSchema.pick({ name: true, type: true }));

export type CreateWallet = z.infer<typeof CreateWalletSchema>;

export const CreateWalletResponseSchema = APIResponseSchema({
  schema: WalletSchema,
});

export const ShowWalletResponseSchema = APIResponseSchema({
  schema: WalletSchema,
});

export const DeleteWalletResponseSchema = APIResponseSchema({
  schema: WalletSchema,
});

export const UpdateWalletSchema = WalletSchema.pick({ name: true });

export type UpdateWallet = z.infer<typeof UpdateWalletSchema>;

export const UpdateWalletResponseSchema = APIResponseSchema({
  schema: WalletSchema,
});
