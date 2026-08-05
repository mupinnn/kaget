import { Link, type LinkOptions } from "@tanstack/react-router";
import { ReceiptTextIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { RecordListItem as RecordListItemType } from "../data/records.schemas";
import { RecordListItem } from "./record-list-item";

export function RecordListLoader() {
  return (
    <div className="divide-y">
      {["a", "b", "c", "d", "e"].map(id => (
        <div key={id} className="py-2.5">
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

export interface RecordListProps {
  data: RecordListItemType[];
  emptyMessageTitle?: string;
  emptyMessageDescription?: string;
  actionLinkProps?: LinkOptions;
  withActions?: boolean;
}

export function RecordList({
  data,
  emptyMessageTitle = "No records yet",
  emptyMessageDescription = "Record spending or income against a wallet or budget on this device.",
  actionLinkProps,
  withActions = true,
}: RecordListProps) {
  if (data?.length > 0) {
    return (
      <div className="divide-y">
        {data.map(record => (
          <RecordListItem key={record.id} {...record} />
        ))}
      </div>
    );
  }

  return (
    <EmptyState
      className="p-4"
      title={emptyMessageTitle}
      description={emptyMessageDescription}
      icon={ReceiptTextIcon}
      actions={
        withActions ? (
          <Button asChild className="no-underline" size="sm">
            <Link to="/records/create" {...actionLinkProps}>
              Record cashflow
            </Link>
          </Button>
        ) : null
      }
    />
  );
}
