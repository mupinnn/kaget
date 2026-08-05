import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { Trash2Icon } from "lucide-react";
import { match, P } from "ts-pattern";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { HidableBalance } from "@/components/hidable-balance";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/libs/utils.lib";
import { formatDate } from "@/utils/date.util";
import { useDeleteRecordMutation } from "../data/records.mutations";
import { useRecordDetailQuery, useRecordItemsQuery } from "../data/records.queries";
import { RECORD_TYPE_LABEL } from "../data/records.schemas";
import { getRecordAmountValueAndClasses, getRecordSourceName } from "../data/records.services";

const route = getRouteApi("/_app/(records)/records/$recordId");

function RecordDetailLoader() {
  return (
    <div className="space-y-3">
      <Skeleton className="size-8 rounded-md" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

function RecordQueryError({
  message = "Couldn't load this section.",
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-lg border border-dashed px-3 py-4 text-muted-foreground text-sm">
      {message}{" "}
      <button
        type="button"
        className="font-medium text-foreground underline-offset-4 hover:underline"
        onClick={onRetry}
      >
        Try again
      </button>
    </div>
  );
}

export function RecordsDetailPage() {
  const { recordId } = route.useParams();
  const navigate = useNavigate();
  const recordDetailQuery = useRecordDetailQuery(recordId);
  const recordItemsQuery = useRecordItemsQuery(recordId);
  const deleteRecordMutation = useDeleteRecordMutation();

  if (recordDetailQuery.isPending || recordItemsQuery.isPending) {
    return <RecordDetailLoader />;
  }

  if (recordDetailQuery.isError) {
    return (
      <RecordQueryError
        message="Couldn't load this record."
        onRetry={() => void recordDetailQuery.refetch()}
      />
    );
  }

  if (recordItemsQuery.isError) {
    return (
      <RecordQueryError
        message="Couldn't load line items."
        onRetry={() => void recordItemsQuery.refetch()}
      />
    );
  }

  const recordDetail = recordDetailQuery.data;
  const recordItems = recordItemsQuery.data ?? [];
  const { className, value, operator } = getRecordAmountValueAndClasses(recordDetail);

  const handleDeleteRecord = () => {
    deleteRecordMutation.mutate(recordId, {
      async onSuccess() {
        await navigate({ to: "/records" });
      },
    });
  };

  return (
    <PageLayout
      title={recordDetail.note ?? "Record"}
      badge={RECORD_TYPE_LABEL[recordDetail.recordType]}
      subtitle={
        <>
          <p className="font-semibold text-xl tabular-nums tracking-tight">
            <span className={cn(className)}>
              <HidableBalance value={value} />
            </span>
          </p>
          <p className="text-muted-foreground text-sm">{getRecordSourceName(recordDetail)}</p>
          <p className="text-muted-foreground text-xs">
            {formatDate(recordDetail.recordedAt, { dateStyle: "full", timeStyle: "short" })}
          </p>
        </>
      }
    >
      {recordDetail.sourceType === "WALLET" ? (
        <div className="flex items-center gap-2">
          <ConfirmationDialog
            title="Delete this record?"
            description="This cannot be undone. The amount will roll back to the source wallet."
            trigger={
              <Button variant="destructive" size="sm">
                <Trash2Icon />
                Delete
              </Button>
            }
            actionLabel="Yes, delete"
            onClickAction={handleDeleteRecord}
          />
        </div>
      ) : null}

      {match(recordItems)
        .with(
          P.when(d => d.length > 0),
          () => (
            <div className="divide-y rounded-lg border">
              {recordItems.map(recordItem => (
                <div
                  key={recordItem.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                >
                  <p className="min-w-0 truncate">{recordItem.note || "Line item"}</p>
                  <p className={cn("shrink-0 font-medium tabular-nums", className)}>
                    {operator}
                    <HidableBalance value={recordItem.amount} />
                  </p>
                </div>
              ))}
            </div>
          )
        )
        .otherwise(() => null)}
    </PageLayout>
  );
}
