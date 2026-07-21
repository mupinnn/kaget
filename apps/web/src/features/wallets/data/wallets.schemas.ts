import { createWalletSchema, updateWalletSchema } from "@kaget/api/schemas";
import type { InferResponseType } from "hono/client";
import type { z } from "zod";
import { api } from "@/libs/api.lib";

export { createWalletSchema, updateWalletSchema };

export type CreateWallet = z.infer<typeof createWalletSchema>;
export type UpdateWallet = z.infer<typeof updateWalletSchema>;
export type Wallet = InferResponseType<typeof api.api.wallets.$get, 200>["data"][number];
export type WalletDetail = InferResponseType<(typeof api.api.wallets)[":id"]["$get"], 200>["data"];

export type WalletsRequestQuery = {
  type?: Wallet["type"];
  limit?: number;
};
