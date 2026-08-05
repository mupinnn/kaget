import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { HidableBalance } from "@/components/hidable-balance";
import { SOURCE_TYPE_LABEL } from "@/features/records/data/records.schemas";
import { cn } from "@/libs/utils.lib";
import { formatDate } from "@/utils/date.util";
import type { Transfer } from "../data/transfers.schemas";

export type TransferListItemProps = Transfer;

export function TransferListItem(props: TransferListItemProps) {
  const isIncoming = props.type === "INCOMING";
  const amountClassName = cn(
    "font-semibold tabular-nums tracking-tight",
    isIncoming ? "text-success" : "text-destructive"
  );

  return (
    <div className="flex flex-col gap-1 py-2.5 text-sm">
      <p className="inline-flex min-w-0 flex-wrap items-center gap-1.5 font-medium leading-tight">
        <span className="truncate">
          {props.sourceName}
          <span className="font-normal text-muted-foreground">
            {" "}
            · {SOURCE_TYPE_LABEL[props.sourceType]}
          </span>
        </span>
        {isIncoming ? (
          <ArrowLeftIcon className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ArrowRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate">
          {props.destinationName}
          <span className="font-normal text-muted-foreground">
            {" "}
            · {SOURCE_TYPE_LABEL[props.destinationType]}
          </span>
        </span>
      </p>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          {props.note ? <p className="truncate text-muted-foreground">{props.note}</p> : null}
          <p className="text-muted-foreground text-xs">
            {formatDate(props.transferredAt, { timeStyle: "short" })}
            <span className="text-muted-foreground/70"> · Ref {props.refId}</span>
          </p>
        </div>
        <div className="shrink-0 space-y-0.5 text-right">
          <p className={amountClassName}>
            <HidableBalance value={props.amount} />
          </p>
          {props.fee > 0 ? (
            <p className="text-muted-foreground text-xs tabular-nums">
              Fee <HidableBalance value={props.fee} />
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
