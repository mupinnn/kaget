import { match, P } from "ts-pattern";
import { getRouteApi } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { PageLayout } from "@/components/page-layout";
import { formatCurrency } from "@/utils/common.util";
import { formatDate } from "@/utils/date.util";
import { cn } from "@/libs/utils.lib";
import { useRecordDetailQuery, useRecordItemsQuery } from "../data/records.queries";
import { useDeleteRecordMutation } from "../data/records.mutations";

const route = getRouteApi("/records/$recordId");

export function RecordsDetailPage() {
  const { recordId } = route.useParams();
  const recordDetailQuery = useRecordDetailQuery(recordId);
  const recordItemsQuery = useRecordItemsQuery(recordId);
  const deleteRecordMutation = useDeleteRecordMutation();

  if (recordDetailQuery.isPending || recordItemsQuery.isPending) return <p>Loading . . .</p>;
  if (recordDetailQuery.isError || recordItemsQuery.isError)
    return (
      <p>
        An error occurred: {recordDetailQuery.error?.message || recordItemsQuery.error?.message}
      </p>
    );

  const recordDetail = recordDetailQuery.data.data;
  const recordItems = recordItemsQuery.data.data;
  const isAddition = match(recordDetail.record_type)
    .with(P.union("INCOME", "LOAN", "DEBT_COLLECTION"), () => true)
    .with(P.union("EXPENSE", "DEBT", "DEBT_REPAYMENT"), () => false)
    .exhaustive();
  const amountClassname = cn(isAddition ? "text-success" : "text-destructive");
  const amountOperator = isAddition ? "+" : "-";

  return (
    <PageLayout
      title={recordDetail.note}
      subtitle={
        <>
          <p className="text-xl">
            <span className={cn("font-medium", amountClassname)}>
              {amountOperator}
              {formatCurrency(recordDetail.amount)}
            </span>{" "}
            - {recordDetail.source.name}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatDate(recordDetail.recorded_at, { dateStyle: "full", timeStyle: "long" })}
          </p>
        </>
      }
      badge={recordDetail.record_type}
    >
      <div className="flex items-center gap-2">
        <ConfirmationDialog
          title="Are you sure?"
          description="This action cannot be undone. This will permanently delete your record and rollback the amount into the respective source (wallet, budget, or debt)."
          trigger={
            <Button variant="destructive" size="sm">
              Delete
            </Button>
          }
          actionLabel="Yes, delete"
          onClickAction={() => deleteRecordMutation.mutate(recordId)}
        />
      </div>

      {match(recordItems)
        .with(
          P.when(d => d.length > 0),
          () => (
            <div className="divide-y divide-dashed rounded-lg border border-dashed p-2">
              {recordItems.map(recordItem => (
                <div key={recordItem.id} className="flex items-center justify-between py-2 text-sm">
                  <p>{recordItem.note}</p>
                  <p className={cn("text-right", amountClassname)}>
                    {amountOperator}
                    {formatCurrency(recordItem.amount)}
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
