import { ArrowDownIcon } from "lucide-react";
import { getRouteApi } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { PageLayout } from "@/components/page-layout";
import { formatCurrency } from "@/utils/common.util";
import { formatDate } from "@/utils/date.util";
import { useTransferDetailQuery } from "../data/transfers.queries";

const route = getRouteApi("/transfers/$transferId");

export function TransfersDetailPage() {
  const { transferId } = route.useParams();
  const transferDetailQuery = useTransferDetailQuery(transferId);

  if (transferDetailQuery.isPending) return <p>Loading . . .</p>;
  if (transferDetailQuery.isError)
    return <p>An error occurred: {transferDetailQuery.error?.message}</p>;

  const transferDetail = transferDetailQuery.data.data;

  return (
    <PageLayout
      badge="TRANSFER"
      title={
        <>
          <span>
            {transferDetail.source.name} ({transferDetail.source_type})
          </span>
          <ArrowDownIcon className="sm:-rotate-90" />
          <span>
            {transferDetail.destination.name} ({transferDetail.destination_type})
          </span>
        </>
      }
      titleClassName="flex flex-col text-xl sm:flex-row sm:gap-2 sm:items-center"
      subtitle={
        <>
          <p className="font-medium text-success">{formatCurrency(transferDetail.amount)}</p>
          <p className="text-sm text-muted-foreground">
            {formatDate(transferDetail.created_at, { dateStyle: "full", timeStyle: "long" })}
          </p>
        </>
      }
    >
      <div className="flex items-center gap-2">
        <ConfirmationDialog
          title="Are you sure?"
          description="This action cannot be undone. This will permanently delete your transfer and rollback the amount into the respective source (wallet or budget)."
          trigger={
            <Button variant="destructive" size="sm">
              Delete
            </Button>
          }
          actionLabel="Yes, delete"
        />
      </div>
    </PageLayout>
  );
}
