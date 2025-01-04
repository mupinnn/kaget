import { Link, LinkOptions } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ReceiptTextIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { RecordWithRelations } from "../data/records.schemas";
import { RecordListItem } from "./record-list-item";

export const RecordListLoader = () => {
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

export interface RecordListProps {
  data: RecordWithRelations[];
  emptyMessageTitle?: string;
  emptyMessageDescription?: string;
  actionLinkProps?: LinkOptions;
  withActions?: boolean;
}

export const RecordList = ({
  data,
  emptyMessageTitle = "No records created",
  emptyMessageDescription = "Don't forget to record every money you spend or get. It's precious.",
  actionLinkProps,
  withActions = true,
}: RecordListProps) => {
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
      title={emptyMessageTitle}
      description={emptyMessageDescription}
      icon={ReceiptTextIcon}
      actions={
        withActions ? (
          <Button asChild className="no-underline">
            <Link to="/records/create" {...actionLinkProps}>
              Record cashflow
            </Link>
          </Button>
        ) : null
      }
    />
  );
};
