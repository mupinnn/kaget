import { getRouteApi } from "@tanstack/react-router";
import { PlusIcon, ReceiptTextIcon, RefreshCwIcon, Undo2Icon } from "lucide-react";
import { match } from "ts-pattern";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { HidableBalance } from "@/components/hidable-balance";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecordList, RecordListLoader } from "@/features/records/components/record-list";
import { useRecordsQuery } from "@/features/records/data/records.queries";
import { TransferList, TransferListLoader } from "@/features/transfers/components/transfer-list";
import { useTransfersQuery } from "@/features/transfers/data/transfers.queries";
import { BudgetBalanceUpdateDialog } from "../components/budget-balance-update-dialog";
import { BudgetCreateRecordsDialog } from "../components/budget-create-records-dialog";
import { useActivateBudgetMutation } from "../data/budgets.mutations";
import { useBudgetDetailQuery } from "../data/budgets.queries";
import { getRemainingBalancePercentage } from "../data/budgets.schemas";

const route = getRouteApi("/_app/(budgets)/budgets/$budgetId");

function BudgetDetailLoader() {
  return (
    <div className="space-y-3">
      <Skeleton className="size-8 rounded-md" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-7 w-32" />
      </div>
      <Skeleton className="h-2 w-full max-w-sm" />
      <Skeleton className="h-4 w-56" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-9 w-full max-w-sm" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

function BudgetQueryError({
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

export function BudgetsDetailPage() {
  const { budgetId } = route.useParams();
  const budgetDetailQuery = useBudgetDetailQuery(budgetId);
  const recordsQuery = useRecordsQuery({ source_id: budgetId, source_type: "BUDGET" });
  const transfersQuery = useTransfersQuery({ source_id: budgetId, source_type: "BUDGET" });
  const activateBudgetMutation = useActivateBudgetMutation();

  if (budgetDetailQuery.isPending) return <BudgetDetailLoader />;
  if (budgetDetailQuery.isError) {
    return (
      <BudgetQueryError
        message="Couldn't load this budget."
        onRetry={() => void budgetDetailQuery.refetch()}
      />
    );
  }

  const budgetDetail = budgetDetailQuery.data;
  const badge = budgetDetail.archivedAt
    ? `Archived · ${budgetDetail.wallet.name}`
    : budgetDetail.wallet.name;

  return (
    <PageLayout
      title={budgetDetail.name}
      badge={badge}
      subtitle={
        <p className="font-semibold text-foreground text-xl tabular-nums tracking-tight">
          <HidableBalance value={budgetDetail.balance} />
        </p>
      }
    >
      <div className="flex max-w-sm flex-col gap-1.5">
        <Progress value={getRemainingBalancePercentage(budgetDetail)} className="h-1.5" />
        <p className="text-muted-foreground text-xs tabular-nums">
          <HidableBalance value={budgetDetail.usedAmount} /> used of{" "}
          <HidableBalance value={budgetDetail.totalBalance} />
        </p>
      </div>

      {!budgetDetail.archivedAt ? (
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
        </div>
      ) : (
        <ConfirmationDialog
          title={<>Activate &quot;{budgetDetail.name}&quot; again?</>}
          description={`You can spend from this envelope again. Make sure ${budgetDetail.wallet.name} has enough balance.`}
          trigger={
            <Button size="sm">
              <RefreshCwIcon />
              Activate
            </Button>
          }
          actionLabel="Activate"
          onClickAction={() => activateBudgetMutation.mutate(budgetId)}
        />
      )}

      <Tabs defaultValue="records">
        <TabsList className="grid h-9 w-full grid-cols-2 sm:w-80">
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
        </TabsList>
        <TabsContent value="records" className="mt-3">
          {match(recordsQuery)
            .with({ isPending: true }, () => <RecordListLoader />)
            .with({ isError: true }, () => (
              <BudgetQueryError
                message="Couldn't load records."
                onRetry={() => void recordsQuery.refetch()}
              />
            ))
            .otherwise(query => (
              <RecordList
                data={query.data}
                emptyMessageTitle="No records yet"
                emptyMessageDescription="Spend from this envelope when you use the budget."
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
        <TabsContent value="transfers" className="mt-3">
          {match(transfersQuery)
            .with({ isPending: true }, () => <TransferListLoader />)
            .with({ isError: true }, () => (
              <BudgetQueryError
                message="Couldn't load transfers."
                onRetry={() => void transfersQuery.refetch()}
              />
            ))
            .otherwise(query => (
              <TransferList
                data={query.data}
                emptyMessageTitle="No transfers yet"
                emptyMessageDescription="Fund or move money for this envelope from Transfers."
                withActions={false}
              />
            ))}
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
