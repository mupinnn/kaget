import { Link } from "@tanstack/react-router";
import { P, match } from "ts-pattern";
import { formatCurrency } from "@/utils/common.util";
import { dateFormatter } from "@/utils/date.util";
import { cn } from "@/libs/utils.lib";
import { RecordWithRelations } from "../data/records.schema";

export type RecordListItemProps = RecordWithRelations;

export const RecordListItem = (props: RecordListItemProps) => {
  const isAddition = match(props.record_type)
    .with(P.union("INCOME", "LOAN", "DEBT_COLLECTION"), () => true)
    .with(P.union("EXPENSE", "DEBT", "DEBT_REPAYMENT"), () => false)
    .exhaustive();

  return (
    <Link
      to="/records/$recordId"
      params={{ recordId: props.id }}
      className="flex items-center justify-between py-2 text-sm no-underline"
    >
      <div className="space-y-1">
        <p>{props.note}</p>
        <p className="text-xs">
          {props.source.name} - {props.source_type}
        </p>
      </div>
      <div className="space-y-1 text-right">
        <p className={cn(isAddition ? "text-success" : "text-destructive")}>
          {isAddition ? "+" : "-"}
          {formatCurrency(props.amount)}
        </p>
        <p className="text-xs">{dateFormatter.format(new Date(props.recorded_at))}</p>
      </div>
    </Link>
  );
};
