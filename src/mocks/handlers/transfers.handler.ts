import { http } from "msw";
import { nanoid } from "nanoid";
import { db } from "@/libs/db.lib";
import { mockSuccessResponse, mockErrorResponse } from "@/utils/mock.util";
import {
  CreateTransferSchema,
  Transfer,
  TransfersRequestQuerySchema,
} from "@/features/transfers/data/transfers.schema";
import { createRecord, getSourceOrDestinationType } from "./records.handler";
import { addWalletBalance, deductWalletBalance } from "./wallets.handler";
import { addSeconds } from "@/utils/date.util";

export const transfersHandler = [
  http.get("/api/v1/transfers", async ({ request }) => {
    try {
      const rawFilters = Object.fromEntries(new URL(request.url).searchParams);
      const parsedFilters = TransfersRequestQuerySchema.parse(rawFilters);

      const storedTransfers = await db.transfer.orderBy("created_at").reverse().toArray();
      const filteredStoredTransfers = storedTransfers.filter(transfer => {
        if (parsedFilters.source_id && transfer.source_id !== parsedFilters.source_id) {
          return false;
        }

        return true;
      });

      return mockSuccessResponse({
        data: filteredStoredTransfers,
        message: "Successfully retrieved transfers",
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
      const generalTransferData: Pick<Transfer, "note" | "amount" | "ref_id"> = {
        note: data.note,
        amount: data.amount,
        ref_id: nanoid(),
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
        created_at: addSeconds(new Date(), 1).toISOString(),
        updated_at: addSeconds(new Date(), 1).toISOString(),
      };

      await db.transaction("rw", db.transfer, db.wallet, db.record, async () => {
        await db.transfer.bulkAdd([outgoingTransfer, incomingTransfer]);

        if (outgoingTransfer.source_type === "WALLET") {
          await deductWalletBalance(outgoingTransfer.source_id, outgoingTransfer.amount);

          if (outgoingTransfer.fee > 0) {
            await createRecord({
              source_id: outgoingTransfer.source_id,
              source_type: outgoingTransfer.source_type,
              record_type: "EXPENSE",
              recorded_at: new Date().toISOString(),
              amount: outgoingTransfer.fee,
              note: `Transfer fee to ${outgoingTransfer.destination.name}`,
            });
          }
        }

        if (incomingTransfer.source_type === "WALLET") {
          await addWalletBalance(incomingTransfer.source_id, incomingTransfer.amount);
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
