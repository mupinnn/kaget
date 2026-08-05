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

export type CreateWallet = z.infer<typeof createWalletSchema>;
export type UpdateWallet = z.infer<typeof updateWalletSchema>;

export type Wallet = {
  id: string;
  name: string;
  type: "CASH" | "DIGITAL";
  balance: number;
  createdAt: Date;
  updatedAt: Date;
};

/** UI labels for stored wallet type enums (domain values unchanged). */
export const WALLET_TYPE_LABEL: Record<Wallet["type"], string> = {
  CASH: "Cash",
  DIGITAL: "Digital",
};

export type WalletDetail = Wallet & {
  records: Array<
    import("@/features/records/data/records.schemas").Record & {
      items: import("@/features/records/data/records.schemas").RecordItem[];
    }
  >;
};

export type WalletsRequestQuery = {
  type?: Wallet["type"];
  limit?: number;
};
