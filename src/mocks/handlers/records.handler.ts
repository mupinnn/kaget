import { http } from "msw";
import { nanoid } from "nanoid";
import { match } from "ts-pattern";
import { db } from "@/libs/db.lib";
import { mockSuccessResponse, mockErrorResponse } from "@/utils/mock.util";
import {
  CreateRecordSchema,
  Record,
  RecordItem,
  RecordsRequestQuerySchema,
  RecordWithRelations,
} from "@/features/records/data/records.schema";
import { NotFoundError } from "@/utils/error.util";
import { isDateBefore, isDateAfter } from "@/utils/date.util";
import { getWalletById } from "./wallets.handler";
import { getBudgetById, getBudgetItemById } from "./budgets.handler";

export async function getRecordById(recordId: string): Promise<Record> {
  const storedRecordById = await db.record.get(recordId);

  if (!storedRecordById) throw new NotFoundError("Record not found");

  return storedRecordById;
}

export async function getRecordWithRelations(recordId: string): Promise<RecordWithRelations> {
  const storedRecordById = await getRecordById(recordId);
  const matchedSourceType = await match(storedRecordById.source_type)
    .with("WALLET", async () => await getWalletById(storedRecordById.source_id))
    .with("BUDGET", async () => await getBudgetById(storedRecordById.source_id))
    .with("BUDGET_DETAIL", async () => await getBudgetItemById(storedRecordById.source_id))
    .exhaustive();

  const storedRecordWithRelations: RecordWithRelations = {
    ...storedRecordById,
    source: matchedSourceType,
  };

  return storedRecordWithRelations;
}

export const recordsHandler = [
  http.get("/api/v1/records", async ({ request }) => {
    try {
      const rawFilters = Object.fromEntries(new URL(request.url).searchParams);
      const parsedFilters = RecordsRequestQuerySchema.parse(rawFilters);

      const storedRecords = await db.record.orderBy("recorded_at").reverse().toArray();
      const filteredStoredRecords = storedRecords.filter(record => {
        if (parsedFilters.source_id && record.source_id !== parsedFilters.source_id) {
          return false;
        }

        if (parsedFilters.start && parsedFilters.end) {
          if (
            isDateBefore(record.recorded_at, parsedFilters.start) ||
            isDateAfter(record.recorded_at, parsedFilters.end)
          ) {
            return false;
          }
        }

        return true;
      });
      const storedRecordsWithRelations: RecordWithRelations[] = await Promise.all(
        filteredStoredRecords.map(async record => {
          const recordWithRelations = await getRecordWithRelations(record.id);
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
      const storedRecordWithRelations = await getRecordWithRelations(params.recordId as string);

      return mockSuccessResponse({
        data: storedRecordWithRelations,
        message: "Successfully retrieved a record",
      });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),

  http.get("/api/v1/records/:recordId/items", async ({ params }) => {
    try {
      const storedRecordItems = await db.record_item
        .where({ record_id: params.recordId as string })
        .toArray();

      return mockSuccessResponse({
        data: storedRecordItems,
        message: "Successfully retrieved a record items",
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
      const newRecordDetail: RecordItem[] = data.items.map(item => ({
        id: nanoid(),
        note: item.note,
        amount: item.amount,
        record_id: newRecord.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      await db.transaction("rw", db.record, db.record_item, db.wallet, async () => {
        await db.wallet.update(newRecord.source_id, {
          balance:
            newRecord.record_type === "INCOME"
              ? data.wallet.balance + newRecord.amount
              : data.wallet.balance - newRecord.amount,
          updated_at: new Date().toISOString(),
        });
        await db.record.add(newRecord);

        if (newRecordDetail.length > 0) {
          await db.record_item.bulkAdd(newRecordDetail);
        }
      });

      return mockSuccessResponse({ data: newRecord, message: "Successfully create a record" });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),

  http.delete("/api/v1/records/:recordId", async ({ params }) => {
    try {
      const recordId = params.recordId as string;
      const storedRecordById = await getRecordById(recordId);

      await db.transaction("rw", db.record, db.record_item, db.wallet, async () => {
        await db.wallet
          .where("id")
          .equals(storedRecordById.source_id)
          .modify(wallet => {
            wallet.balance =
              storedRecordById.record_type === "INCOME"
                ? wallet.balance - storedRecordById.amount
                : wallet.balance + storedRecordById.amount;
            wallet.updated_at = new Date().toISOString();
          });

        await db.record.delete(recordId);
        await db.record_item.where("record_id").equals(recordId).delete();
      });

      return mockSuccessResponse({ data: storedRecordById, message: "Successfully delete record" });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),
];
