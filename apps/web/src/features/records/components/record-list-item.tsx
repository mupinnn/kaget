import { Link } from "@tanstack/react-router";
import { HidableBalance } from "@/components/hidable-balance";
import { cn } from "@/libs/utils.lib";
import { formatDate } from "@/utils/date.util";
import {
  type RecordListItem as RecordListItemType,
  SOURCE_TYPE_LABEL,
} from "../data/records.schemas";
import { getRecordAmountValueAndClasses } from "../data/records.services";

export type RecordListItemProps = RecordListItemType;

export function RecordListItem(props: RecordListItemProps) {
  const { className, value } = getRecordAmountValueAndClasses(props);

  return (
    <Link
      to="/records/$recordId"
      params={{ recordId: props.id }}
      className="flex items-center justify-between gap-3 py-2.5 text-sm no-underline"
    >
      <div className="min-w-0 space-y-0.5">
        <p className="truncate font-medium leading-tight">{props.note || "Untitled record"}</p>
        <p className="truncate text-muted-foreground text-xs">
          {props.sourceName}
          <span className="text-muted-foreground/70"> · {SOURCE_TYPE_LABEL[props.sourceType]}</span>
        </p>
      </div>
      <div className="shrink-0 space-y-0.5 text-right">
        <p className={cn("font-semibold tabular-nums tracking-tight", className)}>
          <HidableBalance value={value} />
        </p>
        <p className="text-muted-foreground text-xs">
          {formatDate(props.recordedAt, { timeStyle: "short" })}
        </p>
      </div>
    </Link>
  );
}
