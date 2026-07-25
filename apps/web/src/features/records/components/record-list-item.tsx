import { Link } from "@tanstack/react-router";
import { HidableBalance } from "@/components/hidable-balance";
import { cn } from "@/libs/utils.lib";
import { formatDate } from "@/utils/date.util";
import type { RecordListItem as RecordListItemType } from "../data/records.schemas";
import { getRecordAmountValueAndClasses } from "../data/records.services";

export type RecordListItemProps = RecordListItemType;

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
          {props.sourceName} - {props.sourceType}
        </p>
      </div>
      <div className="space-y-1 text-right">
        <p className={cn(className)}>
          <HidableBalance value={value} />
        </p>
        <p className="text-xs">{formatDate(props.recordedAt, { timeStyle: "short" })}</p>
      </div>
    </Link>
  );
};
