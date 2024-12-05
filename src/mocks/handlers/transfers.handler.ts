import { http } from "msw";
import { nanoid } from "nanoid";
import { match } from "ts-pattern";
import { db } from "@/libs/db.lib";
import { mockSuccessResponse, mockErrorResponse } from "@/utils/mock.util";
import {
  CreateTransferSchema,
  Transfer,
  TransferWithRelations,
} from "@/features/transfers/data/transfers.schema";
import { NotFoundError } from "@/utils/error.util";
import { getWalletById } from "./wallets.handler";
import { getBudgetById, getBudgetItemById } from "./budgets.handler";

export async function getTransferById(transferId: string) {
  const storedTransferById = await db.transfer.get(transferId);

  if (!storedTransferById) throw new NotFoundError("Transfer not found");

  return storedTransferById;
}

export async function getTransferWithRelations(transferId: string) {
  const storedTransferById = await getTransferById(transferId);

  async function getSourceOrDestinationById(id: string, type: Transfer["source_type"]) {
    return match(type)
      .with("WALLET", async () => await getWalletById(id))
      .with("BUDGET", async () => await getBudgetById(id))
      .with("BUDGET_DETAIL", async () => await getBudgetItemById(id))
      .exhaustive();
  }

  const matchedSource = await getSourceOrDestinationById(storedTransferById.source_id, "WALLET");
  const matchedDestination = await getSourceOrDestinationById(
    storedTransferById.destination_id,
    "WALLET"
  );

  const storedTransferWithRelations: TransferWithRelations = {
    ...storedTransferById,
    source: matchedSource,
    destination: matchedDestination,
  };

  return storedTransferWithRelations;
}

export const transfersHandler = [
  http.get("/api/v1/transfers", async () => {
    try {
      const storedTransfers = await db.transfer.orderBy("created_at").reverse().toArray();
      const storedTransfersWithRelations: TransferWithRelations[] = await Promise.all(
        storedTransfers.map(async transfer => {
          const transferWithRelations = await getTransferWithRelations(transfer.id);
          return transferWithRelations;
        })
      );

      return mockSuccessResponse({
        data: storedTransfersWithRelations,
        message: "Successfully retrieved transfers",
      });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),

  http.post("/api/v1/transfers", async ({ request }) => {
    try {
      const data = CreateTransferSchema.parse(await request.json());
      const newTransfer: Transfer = {
        id: nanoid(),
        note: data.note,
        amount: data.amount,
        source_id: data.source.id,
        source_type: "WALLET",
        destination_id: data.destination.id,
        destination_type: "WALLET",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await db.transaction("rw", db.transfer, db.wallet, async () => {
        await db.transfer.add(newTransfer);
        await db.wallet
          .where("id")
          .equals(newTransfer.source_id)
          .modify(sourceWallet => {
            sourceWallet.balance -= newTransfer.amount;
            sourceWallet.updated_at = new Date().toISOString();
          });
        await db.wallet
          .where("id")
          .equals(newTransfer.destination_id)
          .modify(destinationWallet => {
            destinationWallet.balance += newTransfer.amount;
            destinationWallet.updated_at = new Date().toISOString();
          });
      });

      return mockSuccessResponse({ data: newTransfer, message: "Success transferring a fund" });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),
];
