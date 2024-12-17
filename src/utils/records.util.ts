import { match, P } from "ts-pattern";
import { cn } from "@/libs/utils.lib";
import { Record } from "@/features/records/data/records.schema";
import { formatCurrency } from "./common.util";

export function getRecordAmountValueAndClasses(record: Record) {
  const isAddition = match(record.record_type)
    .with(P.union("INCOME", "LOAN", "DEBT_COLLECTION"), () => true)
    .with(P.union("EXPENSE", "DEBT", "DEBT_REPAYMENT"), () => false)
    .exhaustive();
  const className = cn(isAddition ? "text-success" : "text-destructive");
  const operator = isAddition ? "+" : "-";
  const value = `${operator} ${formatCurrency(record.amount)}`;

  return { className, value, operator };
}
