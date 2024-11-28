import { http } from "msw";
import { nanoid } from "nanoid";
import { match } from "ts-pattern";
import { db } from "@/libs/db.lib";
import { mockSuccessResponse, mockErrorResponse } from "@/utils/mock.util";
import {
  CreateRecordSchema,
  Record,
  RecordDetail,
  RecordWithRelations,
  ShowRecordResponse,
} from "@/features/records/data/records.schema";
import { NotFoundError } from "@/utils/error.util";

export const recordsHandler = [
  http.get("/api/v1/records", async () => {
    try {
      const storedRecords = await db.record.toArray();
      const storedRecordsWithRelations: RecordWithRelations[] = await Promise.all(
        storedRecords.map(async record => {
          const source = await match(record.source_type)
            .with("WALLET", async () => {
              const walletBySourceId = await db.wallet.get(record.source_id);

              if (!walletBySourceId) throw new NotFoundError("Wallet not found");

              return walletBySourceId;
            })
            .with("BUDGET", async () => {
              const budgetBySourceId = await db.budget.get(record.source_id);

              if (!budgetBySourceId) throw new NotFoundError("Budget not found");

              return budgetBySourceId;
            })
            .with("BUDGET_DETAIL", async () => {
              const budgetDetailBySourceId = await db.budget_detail.get(record.source_id);

              if (!budgetDetailBySourceId) throw new NotFoundError("Budget detail not found");

              return budgetDetailBySourceId;
            })
            .exhaustive();

          const recordWithRelations: RecordWithRelations = {
            ...record,
            source,
          };

          return recordWithRelations;
        })
      );

      return mockSuccessResponse({
        data: storedRecordsWithRelations,
        message: "Successfully retrieved records",
      });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),

  http.get("/api/v1/records/:recordId", async ({ params }) => {
    try {
      const recordId = params.recordId as string;
      const storedRecord = await db.record.get(recordId);

      if (!storedRecord) throw new NotFoundError("Record not found");

      const storedRecordItems = await db.record_detail.where({ record_id: recordId }).toArray();
      const matchedRecordSourceType = await match(storedRecord.source_type)
        .with("WALLET", async () => {
          const walletBySourceId = await db.wallet.get(storedRecord.source_id);

          if (!walletBySourceId) throw new NotFoundError("Wallet not found");

          return walletBySourceId;
        })
        .with("BUDGET", async () => {
          const budgetBySourceId = await db.budget.get(storedRecord.source_id);

          if (!budgetBySourceId) throw new NotFoundError("Budget not found");

          return budgetBySourceId;
        })
        .with("BUDGET_DETAIL", async () => {
          const budgetDetailBySourceId = await db.budget_detail.get(storedRecord.source_id);

          if (!budgetDetailBySourceId) throw new NotFoundError("Budget detail not found");

          return budgetDetailBySourceId;
        })
        .exhaustive();

      const storedRecordWithRelations: ShowRecordResponse["data"] = {
        ...storedRecord,
        source: matchedRecordSourceType,
        items: storedRecordItems,
      };

      return mockSuccessResponse({
        data: storedRecordWithRelations,
        message: "Successfully retrieved a record",
      });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),

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
