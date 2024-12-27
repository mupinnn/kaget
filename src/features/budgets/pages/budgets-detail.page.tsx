import { getRouteApi } from "@tanstack/react-router";
import { match } from "ts-pattern";
import { Undo2Icon, PlusIcon, Trash2Icon, ReceiptTextIcon } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransferList, TransferListLoader } from "@/features/transfers/components/transfer-list";
import { RecordList, RecordListLoader } from "@/features/records/components/record-list";
import { formatCurrency } from "@/utils/common.util";
import { useRecordsQuery } from "@/features/records/data/records.queries";
import { useTransfersQuery } from "@/features/transfers/data/transfers.queries";
import { useBudgetDetailQuery } from "../data/budgets.queries";
import { useDeletBudgetMutation } from "../data/budgets.mutations";
import { BudgetBalanceUpdateDialog } from "../components/budget-balance-update-dialog";
import { BudgetCreateRecordsDialog } from "../components/budget-create-records-dialog";

const route = getRouteApi("/budgets/$budgetId");

export function BudgetsDetailPage() {
  const { budgetId } = route.useParams();
  const budgetDetailQuery = useBudgetDetailQuery(budgetId);
  const recordsQuery = useRecordsQuery({ source_id: budgetId });
  const transfersQuery = useTransfersQuery({ source_id: budgetId });
  const deleteBudgetMutation = useDeletBudgetMutation();

  if (budgetDetailQuery.isPending) return <p>Loading . . .</p>;
  if (budgetDetailQuery.isError) return <p>An error occured: {budgetDetailQuery.error.message}</p>;

  const budgetDetail = budgetDetailQuery.data.data;
  const budgetHasRecords = (recordsQuery.data?.data?.length ?? 0) > 0;

  return (
    <PageLayout title={budgetDetail.name} badge={`BUDGET - ${budgetDetail.wallet.name}`}>
      <div className="flex flex-col gap-2 sm:w-96">
        <Progress value={budgetDetail.remaining_balance_percentage} />
        <div className="inline-flex items-center gap-2">
          <div className="h-3 w-3 bg-primary" />
          <span className="text-xs">
            Remaining : {formatCurrency(budgetDetail.remaining_balance)}
          </span>
        </div>
        <div className="inline-flex items-center gap-2">
          <div className="h-3 w-3 bg-primary/20" />
          <span className="text-xs">Used : {formatCurrency(budgetDetail.used_balance)}</span>
        </div>
      </div>

      {!budgetDetail.archived_at && (
        <div className="flex flex-wrap items-center gap-2">
          <BudgetCreateRecordsDialog
            budgetDetail={budgetDetail}
            trigger={
              <Button size="sm">
                <ReceiptTextIcon />
                Use budget
              </Button>
            }
          />
          <BudgetBalanceUpdateDialog
            type="ADD"
            budgetDetail={budgetDetail}
            trigger={
              <Button variant="secondary" size="sm">
                <PlusIcon />
                Add balance
              </Button>
            }
          />
          <BudgetBalanceUpdateDialog
            type="REFUND"
            budgetDetail={budgetDetail}
            trigger={
              <Button variant="outline" size="sm">
                <Undo2Icon />
                Refund
              </Button>
            }
          />
          {!budgetHasRecords && (
            <ConfirmationDialog
              title={<>Are you sure want to delete &quot;{budgetDetail.name}&quot; budget?</>}
              description="This action cannot be undone. This will permanently delete your budget and will rollback the balance into the respective source (wallet)."
              trigger={
                <Button variant="destructive" size="sm">
                  <Trash2Icon />
                  Delete
                </Button>
              }
              actionLabel="Yes, delete"
              onClickAction={() => deleteBudgetMutation.mutate(budgetId)}
            />
          )}
        </div>
      )}

      <Tabs defaultValue="records">
        <TabsList className="grid w-full grid-cols-2 sm:w-96">
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
        </TabsList>
        <TabsContent value="records">
          {match(recordsQuery)
            .with({ isPending: true }, () => <RecordListLoader />)
            .with({ isError: true }, () => <p>An error occured</p>)
            .otherwise(recordsQuery => (
              <RecordList
                data={recordsQuery.data.data}
                emptyMessageDescription="You have not record any transactions for this budget"
                withActions={false}
                actionLinkProps={{
                  to: "/records/create",
                  search: {
                    source_id: budgetId,
                    source_type: "BUDGET",
                  },
                }}
              />
            ))}
        </TabsContent>
        <TabsContent value="transfers">
          {match(transfersQuery)
            .with({ isPending: true }, () => <TransferListLoader />)
            .with({ isError: true }, () => <p>An error occured</p>)
            .otherwise(transfersQuery => (
              <TransferList
                data={transfersQuery.data.data}
                emptyMessageDescription="You have no transfers for this budget"
                withActions={false}
              />
            ))}
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
