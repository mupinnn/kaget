import { http } from "msw";
import { nanoid } from "nanoid";
import { match } from "ts-pattern";
import { db } from "@/libs/db.lib";
import { mockSuccessResponse, mockErrorResponse } from "@/utils/mock.util";
import {
  CreateTransfer,
  CreateTransferSchema,
  Transfer,
  TransfersRequestQuerySchema,
} from "@/features/transfers/data/transfers.schema";
import { addSeconds } from "@/utils/date.util";
import { noopAsync } from "@/utils/common.util";
import { createRecord, getSourceOrDestinationType } from "./records.handler";
import { addWalletBalance, deductWalletBalance } from "./wallets.handler";
import { addBudgetBalance, deductBudgetBalance } from "./budgets.handler";

export async function createTransfer(transfer: CreateTransfer) {
  const sourceType = getSourceOrDestinationType(transfer.source);
  const destinationType = getSourceOrDestinationType(transfer.destination);
  const generalTransferData: Pick<Transfer, "note" | "amount" | "ref_id"> = {
    note: transfer.note,
    amount: transfer.amount,
    ref_id: nanoid(),
  };
  const outgoingTransfer: Transfer = {
    ...generalTransferData,
    id: nanoid(),
    fee: transfer.fee,
    source_id: transfer.source.id,
    source_type: sourceType,
    source: transfer.source,
    destination_id: transfer.destination.id,
    destination: transfer.destination,
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
    source_id: transfer.destination.id,
    source_type: destinationType,
    source: transfer.destination,
    destination_id: transfer.source.id,
    destination_type: sourceType,
    destination: transfer.source,
    created_at: addSeconds(new Date(), 1).toISOString(),
    updated_at: addSeconds(new Date(), 1).toISOString(),
  };

  await db.transfer.bulkAdd([outgoingTransfer, incomingTransfer]);

  await match(outgoingTransfer.source_type)
    .with("WALLET", async () => {
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
    })
    .with("BUDGET", async () => {
      await deductBudgetBalance(outgoingTransfer.source_id, outgoingTransfer.amount);
    })
    .with("BUDGET_ITEM", noopAsync)
    .exhaustive();

  await match(incomingTransfer.source_type)
    .with("WALLET", async () => {
      await addWalletBalance(incomingTransfer.source_id, incomingTransfer.amount);
    })
    .with("BUDGET", async () => {
      await addBudgetBalance(incomingTransfer.source_id, incomingTransfer.amount);
    })
    .with("BUDGET_ITEM", noopAsync)
    .exhaustive();
}

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
      const sortedStoredTransfers = filteredStoredTransfers
        .sort((a, b) => {
          if (a.type === "INCOMING" && b.type === "OUTGOING") return -1;
          if (b.type === "OUTGOING" && a.type === "INCOMING") return 1;
          return 0;
        })
        .sort((a, b) => {
          if (a.ref_id < b.ref_id) return -1;
          if (b.ref_id > a.ref_id) return 1;
          return 0;
        });

      return mockSuccessResponse({
        data: sortedStoredTransfers,
        message: "Successfully retrieved transfers",
      });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),

  http.post("/api/v1/transfers", async ({ request }) => {
    try {
      const data = CreateTransferSchema.parse(await request.json());

      await db.transaction("rw", db.transfer, db.wallet, db.record, async () => {
        await createTransfer(data);
      });

      const latestCreatedTransfer = await db.transfer.orderBy("created_at").last();

      return mockSuccessResponse({
        data: latestCreatedTransfer,
        message: "Success transferring a fund",
      });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),
];
