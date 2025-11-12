import { nanoid } from "nanoid";
import { match, P } from "ts-pattern";
import { db } from "@/libs/db.lib";
import { successResponse } from "@/utils/service.util";
import { isDateBefore, isDateAfter } from "@/utils/date.util";
import { matchZodSchema, cn } from "@/libs/utils.lib";
import { formatCurrency, noop, noopAsync } from "@/utils/common.util";
import { WalletSchema } from "@/features/wallets/data/wallets.schemas";
import { BudgetSchema, BudgetItemSchema } from "@/features/budgets/data/budgets.schemas";
import {
  addWalletBalance,
  deductWalletBalance,
  getWalletById,
  updateWalletById,
} from "@/features/wallets/data/wallets.services";
import {
  getBudgetById,
  getBudgetItemById,
  updateBudgetById,
} from "@/features/budgets/data/budgets.services";
import {
  type CreateRecord,
  type RecordItem,
  type RecordWithRelations,
  type SourceType,
  type Record,
  type RecordsRequestQuery,
  RecordWithRelationsSchema,
  RecordsRequestQuerySchema,
  CreateRecordSchema,
  RecordSchema,
  RecordItemSchema,
} from "./records.schemas";

export function getRecordAmountValueAndClasses(record: Record) {
  const isAddition = match(record.record_type)
    .with(P.union("INCOME", "LOAN", "DEBT_COLLECTION"), () => true)
    .with(P.union("EXPENSE", "DEBT", "DEBT_REPAYMENT"), () => false)
    .exhaustive();
  const className = cn(isAddition ? "text-success" : "text-destructive");
  const operator = isAddition ? "+" : "-";
  const value = `${operator} ${formatCurrency(record.amount)}`;

  return { className, value, operator, isAddition };
}

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

  if (!storedRecordById) throw new Error("Record not found");

  return storedRecordById;
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

export async function commitRecord(record: Omit<Record, "id" | "created_at" | "updated_at">) {
  const newRecord: Record = {
    id: nanoid(),
    ...record,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { isAddition } = getRecordAmountValueAndClasses(newRecord);

  await db.record.add(newRecord);

  await match(newRecord.source_type)
    .with("WALLET", async () => {
      await updateWalletById(newRecord.source_id, wallet => {
        wallet.balance = isAddition
          ? wallet.balance + newRecord.amount
          : wallet.balance - newRecord.amount;
      });
    })
    .with("BUDGET", async () => {
      if (isAddition) {
        noop();
      } else {
        await updateBudgetById(newRecord.source_id, budget => {
          budget.balance -= newRecord.amount;

          if (budget.balance <= 0) {
            budget.archived_at = new Date().toISOString();
          }
        });
      }
    })
    .with("BUDGET_ITEM", noopAsync)
    .exhaustive();
}

export async function getRecordList(query: RecordsRequestQuery = {}) {
  const parsedFilters = RecordsRequestQuerySchema.parse(query);
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

  return successResponse({
    data: RecordWithRelationsSchema.array().parse(storedRecordsWithRelations),
    message: "Successfully retrieved records",
  });
}

export async function getRecordDetail(recordId: string) {
  const storedRecordWithRelations = await getRecordWithRelations(recordId);

  return successResponse({
    data: RecordWithRelationsSchema.parse(storedRecordWithRelations),
    message: "Successfully retrieved record detail",
  });
}

export async function getRecordItemList(recordId: string) {
  const storedRecordItems = await db.record_item.where({ record_id: recordId }).toArray();

  return successResponse({
    data: RecordItemSchema.array().default([]).parse(storedRecordItems),
    message: "Successfully retrieved record items",
  });
}

export async function createRecord(payload: CreateRecord) {
  const data = CreateRecordSchema.parse(payload);
  const sourceType = getSourceOrDestinationType(data.source);
  const newRecord: Record = {
    id: nanoid(),
    note: data.note,
    amount: data.amount,
    source_id: data.source.id,
    source_type: sourceType,
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

  await db.transaction("rw", db.record, db.record_item, db.wallet, db.budget, async () => {
    await commitRecord(newRecord);

    if (newRecordDetail.length > 0) {
      await db.record_item.bulkAdd(newRecordDetail);
    }
  });

  return successResponse({
    data: RecordSchema.parse(newRecord),
    message: "Successfully create a new record",
  });
}

export async function deleteRecord(recordId: string) {
  const storedRecordById = await getRecordById(recordId);
  const { isAddition } = getRecordAmountValueAndClasses(storedRecordById);

  await db.transaction("rw", db.record, db.record_item, db.wallet, async () => {
    if (isAddition) {
      await deductWalletBalance(storedRecordById.source_id, storedRecordById.amount);
    } else {
      await addWalletBalance(storedRecordById.source_id, storedRecordById.amount);
    }

    await db.record.delete(recordId);
    await db.record_item.where("record_id").equals(recordId).delete();
  });

  return successResponse({
    data: RecordSchema.parse(storedRecordById),
    message: "Successfully delete record",
  });
}
