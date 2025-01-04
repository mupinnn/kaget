import { nanoid } from "nanoid";
import { match } from "ts-pattern";
import { db } from "@/libs/db.lib";
import { type CreateTransfer, type Transfer } from "./transfers.schemas";
import { commitRecord, getSourceOrDestinationType } from "@/features/records/data/records.services";
import { addWalletBalance, deductWalletBalance } from "@/features/wallets/data/wallets.services";
import { addBudgetBalance, deductBudgetBalance } from "@/features/budgets/data/budgets.services";
import { addSeconds } from "@/utils/date.util";
import { noopAsync } from "@/utils/common.util";

export async function commitTransfer(transfer: CreateTransfer) {
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
        await commitRecord({
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
