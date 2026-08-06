import { Link } from "@tanstack/react-router";
import { HidableBalance } from "@/components/hidable-balance";
import { cn } from "@/libs/utils.lib";
import { formatDate } from "@/utils/date.util";
import {
  DEBT_LOAN_STATUS_LABEL,
  DEBT_LOAN_TYPE_LABEL,
  type DebtLoanListItem as DebtLoanListItemData,
  getDebtLoanStatus,
} from "../data/debt-loans.schemas";

export type DebtLoanListItemProps = DebtLoanListItemData;

export function DebtLoanListItem(props: DebtLoanListItemProps) {
  const status = getDebtLoanStatus(props);
  const isResolved = status === "RESOLVED";

  return (
    <Link
      to="/debts-loans/$debtLoanId"
      params={{ debtLoanId: props.id }}
      className="flex items-center justify-between gap-3 py-2.5 text-sm no-underline"
    >
      <div className="min-w-0 space-y-0.5">
        <p
          className={cn(
            "truncate font-medium leading-tight",
            isResolved && "text-muted-foreground"
          )}
        >
          {props.otherParty}
        </p>
        <p className="truncate text-muted-foreground text-xs">
          {DEBT_LOAN_TYPE_LABEL[props.type]}
          <span
            className={cn("text-muted-foreground/70", isResolved && "text-muted-foreground/50")}
          >
            {" "}
            · {DEBT_LOAN_STATUS_LABEL[status]} ·{" "}
            {formatDate(props.occurredAt, { dateStyle: "medium" })}
          </span>
        </p>
      </div>
      <div className="shrink-0 space-y-0.5 text-right">
        <p
          className={cn(
            "font-semibold tabular-nums tracking-tight",
            isResolved && "text-muted-foreground"
          )}
        >
          <HidableBalance value={props.amount} />
        </p>
      </div>
    </Link>
  );
}
