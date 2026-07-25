import { match, P } from "ts-pattern";
import { getBudgetList } from "@/features/budgets/data/budgets.services";
import { getWalletList } from "@/features/wallets/data/wallets.services";
import { api } from "@/libs/api.lib";
import { cn } from "@/libs/utils.lib";
import { parseAmount } from "@/utils/amount.util";
import { unwrap, unwrapPaginated } from "@/utils/api.util";
import { formatCurrency } from "@/utils/common.util";
import type {
  ApiRecord,
  CreateRecordForm,
  OwnedRecord,
  RecordListItem,
  RecordsRequestQuery,
} from "./records.schemas";

async function resolveSourceNames(records: ApiRecord[]): Promise<RecordListItem[]> {
  const [wallets, budgets] = await Promise.all([getWalletList(), getBudgetList()]);
  const walletMap = new Map(wallets.map(wallet => [wallet.id, wallet.name]));
  const budgetMap = new Map(budgets.map(budget => [budget.id, budget.name]));

  return records.map(record => ({
    ...record,
    sourceName:
      record.sourceType === "WALLET"
        ? (walletMap.get(record.sourceId) ?? "Wallet")
        : (budgetMap.get(record.sourceId) ?? "Budget"),
  }));
}

export function getRecordAmountValueAndClasses(record: { recordType: string; amount: string }) {
  const amount = parseAmount(record.amount);
  const isAddition = match(record.recordType)
    .with(P.union("INCOME", "LOAN", "DEBT_COLLECTION"), () => true)
    .with(P.union("EXPENSE", "DEBT", "DEBT_REPAYMENT", "LOAN"), () => false)
    .otherwise(() => false);
  const className = cn(isAddition ? "text-success" : "text-destructive");
  const operator = isAddition ? "+" : "-";
  const value = `${operator} ${formatCurrency(amount)}`;

  return { className, value, operator, isAddition };
}

export async function getRecordList(query: RecordsRequestQuery = {}) {
  if (query.source_id && query.source_type === "BUDGET") {
    const result = await unwrap(
      api.api.budgets[":id"].records.$get({
        param: { id: query.source_id },
        query: {
          from_date: query.start,
          to_date: query.end,
          limit: 100,
        },
      })
    );

    return resolveSourceNames(result.records);
  }

  const result = await unwrapPaginated(
    api.api.records.$get({
      query: {
        source_id: query.source_id,
        from_date: query.start,
        to_date: query.end,
        limit: 100,
      },
    })
  );

  return resolveSourceNames(result.data.records);
}

export const getRecordDetail = (recordId: string) =>
  unwrap(api.api.records[":id"].$get({ param: { id: recordId } }));

export async function getRecordItemList(recordId: string) {
  const record = await getRecordDetail(recordId);
  return record.items;
}

function toCreateRecordPayload(payload: CreateRecordForm, sourceType: "WALLET" | "BUDGET") {
  const items =
    payload.items.length > 0
      ? payload.items
      : [{ amount: payload.amount ?? 0, note: payload.note }];

  return {
    source_id: payload.source.id,
    source_type: sourceType,
    record_type: payload.record_type,
    recorded_at: new Date(payload.dor),
    note: payload.note,
    items,
  };
}

export async function createRecord(payload: CreateRecordForm) {
  const resolvedSourceType = "walletId" in payload.source ? "BUDGET" : "WALLET";

  return unwrap(
    api.api.records.$post({
      json: toCreateRecordPayload(payload, resolvedSourceType),
    })
  );
}

export const deleteRecord = (recordId: string) =>
  unwrap(api.api.records[":id"].$delete({ param: { id: recordId } }));

export function getRecordSourceName(record: OwnedRecord | RecordListItem) {
  if ("sourceName" in record) {
    return record.sourceName;
  }

  if ("wallet" in record && record.wallet) {
    return record.wallet.name;
  }

  if ("budget" in record && record.budget) {
    return record.budget.name;
  }

  return record.sourceType;
}
