import { http } from "msw";
import { nanoid } from "nanoid";
import {
  CreateWalletSchema,
  UpdateWalletSchema,
  Wallet,
  WalletsRequestQuerySchema,
} from "@/features/wallets/data/wallets.schema";
import { mockErrorResponse, mockSuccessResponse } from "@/utils/mock.util";
import { db } from "@/libs/db.lib";
import { NotFoundError } from "@/utils/error.util";

export async function getWalletById(walletId: string) {
  const storedWalletById = await db.wallet.get(walletId);

  if (!storedWalletById) throw new NotFoundError("Wallet not found");

  return storedWalletById;
}

export const walletsHandler = [
  http.get("/api/v1/wallets", async ({ request }) => {
    try {
      const rawFilters = Object.fromEntries(new URL(request.url).searchParams);
      const parsedFilters = WalletsRequestQuerySchema.parse(rawFilters);

      const walletsCollection = db.wallet.orderBy("updated_at").reverse();
      const storedWallets = parsedFilters.limit
        ? await walletsCollection.limit(parsedFilters.limit).toArray()
        : await walletsCollection.toArray();

      const filteredWallets = storedWallets.filter(wallet => {
        if (parsedFilters.type && wallet.type !== parsedFilters.type) return false;
        return true;
      });

      return mockSuccessResponse({
        data: filteredWallets,
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
      const storedWallet = await getWalletById(params.walletId as string);

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
      const walletId = params.walletId as string;
      const walletToBeDeleted = await getWalletById(walletId);

      await db.wallet.delete(walletId);

      const walletRecord = await db.record.where("source_id").equals(walletId).first();

      if (walletRecord) {
        await db.record.where("source_id").equals(walletId).delete();
        await db.record_item.where("record_id").equals(walletRecord.id).delete();
      }

      return mockSuccessResponse({
        data: walletToBeDeleted,
        message: "Successfully delete wallet",
      });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),

  http.patch("/api/v1/wallets/:walletId", async ({ params, request }) => {
    try {
      const walletId = params.walletId as string;
      const data = UpdateWalletSchema.parse(await request.json());
      const updatedWalletRecordsCount = await db.wallet.update(walletId, {
        name: data.name,
        updated_at: new Date().toISOString(),
      });

      if (updatedWalletRecordsCount === 0) {
        throw new NotFoundError("Wallet not found");
      }

      const updatedWallet = await getWalletById(walletId);

      return mockSuccessResponse({ data: updatedWallet, message: "Successfully update wallet" });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),
];
