import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { CheckIcon, Trash2Icon } from "lucide-react";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { HidableBalance } from "@/components/hidable-balance";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/utils/date.util";
import {
  useDeleteDebtLoanMutation,
  useResolveDebtLoanMutation,
} from "../data/debt-loans.mutations";
import { useDebtLoanDetailQuery } from "../data/debt-loans.queries";
import {
  DEBT_LOAN_STATUS_LABEL,
  DEBT_LOAN_TYPE_LABEL,
  getDebtLoanStatus,
} from "../data/debt-loans.schemas";

const route = getRouteApi("/_app/(debt-loans)/debts-loans/$debtLoanId");

function DebtLoanDetailLoader() {
  return (
    <div className="space-y-3">
      <Skeleton className="size-8 rounded-md" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-8 w-40" />
    </div>
  );
}

function DebtLoanQueryError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-dashed px-3 py-4 text-muted-foreground text-sm">
      Couldn&apos;t load this debt or loan.{" "}
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

export function DebtLoansDetailPage() {
  const { debtLoanId } = route.useParams();
  const navigate = useNavigate();
  const debtLoanDetailQuery = useDebtLoanDetailQuery(debtLoanId);
  const resolveDebtLoanMutation = useResolveDebtLoanMutation();
  const deleteDebtLoanMutation = useDeleteDebtLoanMutation();

  if (debtLoanDetailQuery.isPending) {
    return <DebtLoanDetailLoader />;
  }

  if (debtLoanDetailQuery.isError) {
    return <DebtLoanQueryError onRetry={() => void debtLoanDetailQuery.refetch()} />;
  }

  const debtLoan = debtLoanDetailQuery.data;
  const status = getDebtLoanStatus(debtLoan);

  return (
    <PageLayout
      badge={DEBT_LOAN_TYPE_LABEL[debtLoan.type]}
      title={debtLoan.otherParty}
      subtitle={
        <>
          <p className="font-semibold text-xl tabular-nums tracking-tight">
            <HidableBalance value={debtLoan.amount} />
          </p>
          <p className="text-muted-foreground text-sm">
            {DEBT_LOAN_STATUS_LABEL[status]} · {debtLoan.wallet.name}
          </p>
          <p className="text-muted-foreground text-xs">
            {formatDate(debtLoan.occurredAt, { dateStyle: "full", timeStyle: "short" })}
          </p>
          {debtLoan.note ? <p className="text-muted-foreground text-sm">{debtLoan.note}</p> : null}
        </>
      }
    >
      {status === "PENDING" ? (
        <div className="flex flex-wrap gap-2">
          <ConfirmationDialog
            actionLabel="Resolve"
            description={
              debtLoan.type === "DEBT"
                ? "Mark this debt as repaid and create the repayment record."
                : "Mark this loan as collected and create the collection record."
            }
            onClickAction={() => resolveDebtLoanMutation.mutate(debtLoanId)}
            title="Resolve this entry?"
            trigger={
              <Button size="sm">
                <CheckIcon />
                Resolve
              </Button>
            }
          />
          <ConfirmationDialog
            actionLabel="Delete"
            description="Delete this pending debt/loan and reverse the wallet balance change."
            onClickAction={() =>
              deleteDebtLoanMutation.mutate(debtLoanId, {
                async onSuccess() {
                  await navigate({ to: "/debts-loans" });
                },
              })
            }
            title="Delete this entry?"
            trigger={
              <Button size="sm" variant="destructive">
                <Trash2Icon />
                Delete
              </Button>
            }
          />
        </div>
      ) : null}
    </PageLayout>
  );
}
