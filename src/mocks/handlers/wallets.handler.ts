import { http } from "msw";
import { nanoid } from "nanoid";
import { CreateWalletSchema, Wallet } from "@/features/wallets/data/wallets.schema";
import { mockErrorResponse, mockSuccessResponse } from "@/utils/mock.util";
import { db } from "@/libs/db.lib";
import { NotFoundError } from "@/utils/error.util";

export const walletsHandler = [
  http.get("/api/v1/wallets", async () => {
    try {
      const storedWallets = await db.wallet.toArray();

      return mockSuccessResponse({
        data: storedWallets,
        message: "Successfully retrieved wallets",
      });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),

  http.post("/api/v1/wallets", async ({ request }) => {
    try {
      const data = CreateWalletSchema.parse(await request.json());
      const newWallet: Wallet = {
        id: nanoid(),
        name: data.name,
        balance: data.initial_balance,
        type: data.type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await db.wallet.add(newWallet);

      return mockSuccessResponse({ data: newWallet, message: "Successfully create a wallet" });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),

  http.get("/api/v1/wallets/:walletId", async ({ params }) => {
    try {
      const storedWallet = await db.wallet.get({ id: params.walletId });

      if (!storedWallet) {
        throw new NotFoundError("Wallet not found");
      }

      return mockSuccessResponse({
        data: storedWallet,
        message: "Successfully retrieved a wallet",
      });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),

  http.delete("/api/v1/wallets/:walletId", async ({ params }) => {
    try {
      const walletToBeDeleted = await db.wallet.get({ id: params.walletId });

      if (!walletToBeDeleted) {
        throw new NotFoundError("Wallet not found");
      }

      await db.wallet.delete(params.walletId as string);

      return mockSuccessResponse({
        data: walletToBeDeleted,
        message: "Successfully delete wallet",
      });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),
];
