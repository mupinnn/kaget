import { ArrowRightIcon, ArrowLeftIcon } from "lucide-react";
import { formatCurrency } from "@/utils/common.util";
import { formatDate } from "@/utils/date.util";
import { cn } from "@/libs/utils.lib";
import { Badge } from "@/components/ui/badge";
import { type Transfer } from "../data/transfers.schemas";

export type TransferListItemProps = Transfer;

export const TransferListItem = (props: TransferListItemProps) => {
  const transferTypeClassname = cn(props.type === "INCOMING" ? "text-success" : "text-destructive");

  return (
    <div className="flex flex-col gap-1 py-2 text-sm no-underline">
      <Badge variant="secondary" className="self-start">
        Ref: {props.ref_id}
      </Badge>
      <p className="inline-flex items-center gap-2 font-medium">
        <span>
          {props.source.name} ({props.source_type})
        </span>
        {props.type === "INCOMING" ? <ArrowLeftIcon size={16} /> : <ArrowRightIcon size={16} />}
        <span className={transferTypeClassname}>
          {props.destination.name} ({props.destination_type})
        </span>
      </p>
      <div className="flex items-center justify-between">
        <div className="w-max space-y-1">
          {props.note ? <p>{props.note}</p> : null}
          <p className="text-xs">{formatDate(props.created_at, { timeStyle: "short" })}</p>
        </div>
        <p className={cn("break-all text-right font-bold", transferTypeClassname)}>
          {formatCurrency(props.amount)}
        </p>
      </div>
    </div>
  );
};
