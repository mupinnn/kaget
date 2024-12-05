import { http } from "msw";
import { nanoid } from "nanoid";
import { db } from "@/libs/db.lib";
import { mockSuccessResponse, mockErrorResponse } from "@/utils/mock.util";
import { CreateTransferSchema, Transfer } from "@/features/transfers/data/transfers.schema";

export const transfersHandler = [
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

      return mockSuccessResponse({ data: newTransfer, message: "Success transfering a fund" });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),
];
