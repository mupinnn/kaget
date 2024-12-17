import { http } from "msw";
import { nanoid } from "nanoid";
import { db } from "@/libs/db.lib";
import { mockSuccessResponse, mockErrorResponse } from "@/utils/mock.util";
import { CreateTransferSchema, Transfer } from "@/features/transfers/data/transfers.schema";
import { NotFoundError } from "@/utils/error.util";
import { getSourceOrDestinationType } from "./records.handler";
import { updateWalletById } from "./wallets.handler";

export async function getTransferById(transferId: string) {
  const storedTransferById = await db.transfer.get(transferId);

  if (!storedTransferById) throw new NotFoundError("Transfer not found");

  return storedTransferById;
}

export const transfersHandler = [
  http.get("/api/v1/transfers", async () => {
    try {
      const storedTransfers = await db.transfer.orderBy("created_at").reverse().toArray();

      return mockSuccessResponse({
        data: storedTransfers,
        message: "Successfully retrieved transfers",
      });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),

  http.get("/api/v1/transfers/:transferId", async ({ params }) => {
    try {
      const storedTransferById = await getTransferById(params.transferId as string);

      return mockSuccessResponse({
        data: storedTransferById,
        message: "Successfully retrieved a transfer",
      });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),

  http.post("/api/v1/transfers", async ({ request }) => {
    try {
      const data = CreateTransferSchema.parse(await request.json());
      const sourceType = getSourceOrDestinationType(data.source);
      const destinationType = getSourceOrDestinationType(data.destination);
      const generalTransferData: Pick<Transfer, "note" | "amount" | "created_at" | "updated_at"> = {
        note: data.note,
        amount: data.amount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const outgoingTransfer: Transfer = {
        ...generalTransferData,
        id: nanoid(),
        fee: data.fee,
        source_id: data.source.id,
        source_type: sourceType,
        source: data.source,
        destination_id: data.destination.id,
        destination: data.destination,
        destination_type: destinationType,
        type: "OUTGOING",
      };
      const incomingTransfer: Transfer = {
        ...generalTransferData,
        id: nanoid(),
        fee: 0,
        type: "INCOMING",
        source_id: data.destination.id,
        source_type: destinationType,
        source: data.destination,
        destination_id: data.source.id,
        destination_type: sourceType,
        destination: data.source,
      };

      await db.transaction("rw", db.transfer, db.wallet, async () => {
        await db.transfer.bulkAdd([outgoingTransfer, incomingTransfer]);

        if (outgoingTransfer.source_type === "WALLET") {
          await updateWalletById(outgoingTransfer.source_id, wallet => {
            wallet.balance -= outgoingTransfer.amount + outgoingTransfer.fee;
          });
        }

        if (incomingTransfer.source_type === "WALLET") {
          await updateWalletById(incomingTransfer.source_id, wallet => {
            wallet.balance += incomingTransfer.amount;
          });
        }
      });

      return mockSuccessResponse({
        data: outgoingTransfer,
        message: "Success transferring a fund",
      });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),
];
