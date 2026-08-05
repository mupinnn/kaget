import { Link } from "@tanstack/react-router";
import { ArrowRightLeftIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Transfer } from "../data/transfers.schemas";
import { TransferListItem } from "./transfer-list-item";

export function TransferListLoader() {
  return (
    <div className="divide-y">
      {["a", "b", "c", "d", "e"].map(id => (
        <div key={id} className="py-2.5">
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  );
}

export interface TransferListProps {
  data: Transfer[];
  emptyMessageTitle?: string;
  emptyMessageDescription?: string;
  withActions?: boolean;
}

export function TransferList({
  data,
  emptyMessageTitle = "No transfers yet",
  emptyMessageDescription = "Move money between wallets on this device when you need to reshuffle funds.",
  withActions = true,
}: TransferListProps) {
  if (data.length > 0) {
    return (
      <div className="divide-y">
        {data.map(transfer => (
          <TransferListItem key={transfer.id} {...transfer} />
        ))}
      </div>
    );
  }

  return (
    <EmptyState
      className="p-4"
      title={emptyMessageTitle}
      description={emptyMessageDescription}
      icon={ArrowRightLeftIcon}
      actions={
        withActions ? (
          <Button asChild className="no-underline" size="sm">
            <Link to="/transfers/create">Transfer balance</Link>
          </Button>
        ) : null
      }
    />
  );
}
