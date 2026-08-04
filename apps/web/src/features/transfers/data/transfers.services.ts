import { db } from "@/libs/db.lib";
import { createTransferPair, resolveAccount, validateTransferRules } from "@/libs/ledger.lib";
import type { CreateTransferForm, TransfersRequestQuery } from "./transfers.schemas";
import { toCreateTransferInput } from "./transfers.schemas";

export async function getTransferList(query: TransfersRequestQuery = {}) {
  let transfers = await db.transfers.toArray();

  if (query.source_id) {
    transfers = transfers.filter(
      transfer =>
        transfer.sourceId === query.source_id &&
        (!query.source_type || transfer.sourceType === query.source_type)
    );
  }

  transfers.sort((a, b) => b.transferredAt.getTime() - a.transferredAt.getTime());
  return transfers.slice(0, 100);
}

export async function createTransfer(payload: CreateTransferForm) {
  const input = toCreateTransferInput(payload);
  const now = new Date();
  const transferredAt = input.transferred_at ?? now;

  const outgoingId = await db.transaction(
    "rw",
    db.wallets,
    db.budgets,
    db.transfers,
    db.records,
    db.recordItems,
    async () => {
      const sender = await resolveAccount(input.sender_id, input.sender_type);
      const receiver = await resolveAccount(input.receiver_id, input.receiver_type);
      validateTransferRules(sender, receiver, input.amount, input.fee ?? 0);

      return createTransferPair({
        sender,
        receiver,
        amount: input.amount,
        fee: input.fee ?? 0,
        note: input.note,
        transferredAt,
        now,
      });
    }
  );

  const created = await db.transfers.get(outgoingId);
  if (!created) {
    throw new Error("Transfer was not created");
  }
  return created;
}
