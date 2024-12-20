import { Link } from "@tanstack/react-router";
import { formatDate } from "@/utils/date.util";
import { cn } from "@/libs/utils.lib";
import { RecordWithRelations } from "../data/records.schema";
import { getRecordAmountValueAndClasses } from "@/utils/records.util";

export type RecordListItemProps = RecordWithRelations;

export const RecordListItem = (props: RecordListItemProps) => {
  const { className, value } = getRecordAmountValueAndClasses(props);

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
        <p className={cn(className)}>{value}</p>
        <p className="text-xs">{formatDate(props.recorded_at, { timeStyle: "short" })}</p>
      </div>
    </Link>
  );
};
