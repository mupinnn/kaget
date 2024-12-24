import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRightLeftIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TransferListItem } from "./transfer-list-item";
import { Transfer } from "../data/transfers.schema";

export const TransferListLoader = () => {
  return (
    <div className="divide-y">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="py-2">
          <Skeleton className="h-14 w-full" />
        </div>
      ))}
    </div>
  );
};

export interface TransferListProps {
  data: Transfer[];
  emptyMessageTitle?: string;
  emptyMessageDescription?: string;
  withActions?: boolean;
}

export const TransferList = ({
  data,
  emptyMessageTitle = "No transfer yet",
  emptyMessageDescription = "You have not transferring anything. Transfer one above.",
  withActions = true,
}: TransferListProps) => {
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
      title={emptyMessageTitle}
      description={emptyMessageDescription}
      icon={ArrowRightLeftIcon}
      actions={
        withActions ? (
          <Button asChild className="no-underline">
            <Link to="/transfers/create">Transfer balance</Link>
          </Button>
        ) : null
      }
    />
  );
};
