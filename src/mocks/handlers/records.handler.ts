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
  SourceType,
} from "@/features/records/data/records.schema";
import { NotFoundError } from "@/utils/error.util";
import { isDateBefore, isDateAfter } from "@/utils/date.util";
import { matchZodSchema } from "@/libs/utils.lib";
import { WalletSchema } from "@/features/wallets/data/wallets.schema";
import { BudgetSchema, BudgetItemSchema } from "@/features/budgets/data/budgets.schema";
import { getWalletById, updateWalletById } from "./wallets.handler";
import { getBudgetById, getBudgetItemById } from "./budgets.handler";

export function getSourceOrDestinationType(maybeSourceOrDestination: unknown) {
  return match(maybeSourceOrDestination)
    .returnType<SourceType>()
    .with(matchZodSchema(WalletSchema), () => "WALLET")
    .with(matchZodSchema(BudgetSchema), () => "BUDGET")
    .with(matchZodSchema(BudgetItemSchema), () => "BUDGET_ITEM")
    .otherwise(() => {
      throw new Error("Unable to parse source or destination data");
    });
}

export async function getSourceOrDestinationById(id: string, type: SourceType) {
  return match(type)
    .with("WALLET", async () => await getWalletById(id))
    .with("BUDGET", async () => await getBudgetById(id))
    .with("BUDGET_ITEM", async () => await getBudgetItemById(id))
    .exhaustive();
}

export async function getRecordById(recordId: string): Promise<Record> {
  const storedRecordById = await db.record.get(recordId);

  if (!storedRecordById) throw new NotFoundError("Record not found");

  return storedRecordById;
}

export async function createRecord(record: Omit<Record, "id" | "created_at" | "updated_at">) {
  const newRecord: Record = {
    id: nanoid(),
    ...record,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await db.transaction("rw", db.record, db.wallet, async () => {
    await db.record.add(newRecord);

    if (newRecord.source_type === "WALLET") {
      await updateWalletById(newRecord.source_id, wallet => {
        wallet.balance = 0;
      });
    }
  });
}

export async function getRecordWithRelations(recordId: string): Promise<RecordWithRelations> {
  const storedRecordById = await getRecordById(recordId);
  const matchedSourceType = await getSourceOrDestinationById(
    storedRecordById.source_id,
    storedRecordById.source_type
  );
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
