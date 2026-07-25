import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { CheckIcon, Trash2Icon } from "lucide-react";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { HidableBalance } from "@/components/hidable-balance";
import { PageLayout } from "@/components/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/date.util";
import {
  useDeleteDebtLoanMutation,
  useResolveDebtLoanMutation,
} from "../data/debt-loans.mutations";
import { useDebtLoanDetailQuery } from "../data/debt-loans.queries";
import { getDebtLoanStatus } from "../data/debt-loans.schemas";

const route = getRouteApi("/_app/(debt-loans)/debts-loans/$debtLoanId");

export function DebtLoansDetailPage() {
  const { debtLoanId } = route.useParams();
  const navigate = useNavigate();
  const debtLoanDetailQuery = useDebtLoanDetailQuery(debtLoanId);
  const resolveDebtLoanMutation = useResolveDebtLoanMutation();
  const deleteDebtLoanMutation = useDeleteDebtLoanMutation();

  if (debtLoanDetailQuery.isPending) return <p>Loading . . .</p>;
  if (debtLoanDetailQuery.isError)
    return <p>An error occured: {debtLoanDetailQuery.error.message}</p>;

  const debtLoan = debtLoanDetailQuery.data;
  const status = getDebtLoanStatus(debtLoan);

  return (
    <PageLayout
      badge={
        <div className="flex gap-2">
          <Badge>{debtLoan.type}</Badge>
          <Badge variant={status === "PENDING" ? "outline" : "secondary"}>{status}</Badge>
        </div>
      }
      subtitle={
        <p className="text-lg text-muted-foreground">
          <HidableBalance value={debtLoan.amount} />
        </p>
      }
      title={debtLoan.otherParty}
    >
      <div className="space-y-2 text-sm">
        <p>Wallet: {debtLoan.wallet.name}</p>
        <p>
          Occurred: {formatDate(debtLoan.occurredAt, { dateStyle: "full", timeStyle: "short" })}
        </p>
        {debtLoan.note ? <p>Note: {debtLoan.note}</p> : null}
      </div>

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
