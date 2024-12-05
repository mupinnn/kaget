import { Link } from "@tanstack/react-router";
import { ArrowRightIcon } from "lucide-react";
import { formatCurrency } from "@/utils/common.util";
import { formatDate } from "@/utils/date.util";
import { TransferWithRelations } from "../data/transfers.schema";

export type TransferListItemProps = TransferWithRelations;

export const TransferListItem = (props: TransferListItemProps) => {
  return (
    <Link
      to="/transfers/$transferId"
      params={{ transferId: props.id }}
      className="flex flex-col gap-1 py-2 text-sm no-underline"
    >
      <p className="inline-flex items-center gap-2 font-medium">
        <span>
          {props.source.name} ({props.source_type})
        </span>
        <ArrowRightIcon size={16} />
        <span className="text-success">
          {props.destination.name} ({props.destination_type})
        </span>
      </p>
      <div className="flex items-center justify-between">
        <div className="w-max space-y-1">
          {props.note ? <p>{props.note}</p> : null}
          <p className="text-xs">{formatDate(props.created_at, { timeStyle: "short" })}</p>
        </div>
        <p className="break-all text-right font-bold">{formatCurrency(props.amount)}</p>
      </div>
    </Link>
  );
};
