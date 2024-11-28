import { http } from "msw";
import { nanoid } from "nanoid";
import { db } from "@/libs/db.lib";
import { mockSuccessResponse, mockErrorResponse } from "@/utils/mock.util";
import { CreateRecordSchema, Record, RecordDetail } from "@/features/records/data/records.schema";

export const recordsHandler = [
  http.post("/api/v1/records", async ({ request }) => {
    try {
      const data = CreateRecordSchema.parse(await request.json());
      const newRecord: Record = {
        id: nanoid(),
        note: data.note,
        amount: data.amount,
        source_id: data.wallet.id,
        source_type: "WALLET",
        record_type: data.record_type,
        recorded_at: new Date(data.dor).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const newRecordDetail: RecordDetail[] = data.items.map(item => ({
        id: nanoid(),
        note: item.note,
        amount: item.amount,
        record_id: newRecord.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      await db.transaction("rw", db.record, db.record_detail, db.wallet, async () => {
        await db.wallet.update(newRecord.source_id, {
          balance:
            newRecord.record_type === "INCOME"
              ? data.wallet.balance + newRecord.amount
              : data.wallet.balance - newRecord.amount,
          updated_at: new Date().toISOString(),
        });
        await db.record.add(newRecord);

        if (newRecordDetail.length > 0) {
          await db.record_detail.bulkAdd(newRecordDetail);
        }
      });

      return mockSuccessResponse({ data: newRecord, message: "Successfully create a record" });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),
];
