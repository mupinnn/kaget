import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { match } from "ts-pattern";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { TransferList, TransferListLoader } from "../components/transfer-list";
import { useTransfersQuery } from "../data/transfers.queries";

function TransfersQueryError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-dashed px-3 py-4 text-muted-foreground text-sm">
      Couldn&apos;t load transfers.{" "}
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

export function TransfersIndexPage() {
  const transfersQuery = useTransfersQuery();
  const hasTransfers = (transfersQuery.data?.length ?? 0) > 0;

  return (
    <PageLayout
      title="Transfers"
      subtitle="Move money between wallets on this device — optional fee if the rails charge one."
    >
      {match(transfersQuery)
        .with({ isPending: true }, () => <TransferListLoader />)
        .with({ isError: true }, () => (
          <TransfersQueryError onRetry={() => void transfersQuery.refetch()} />
        ))
        .otherwise(query => (
          <>
            {hasTransfers ? (
              <Button asChild className="no-underline" size="sm">
                <Link to="/transfers/create">
                  <PlusIcon />
                  Transfer balance
                </Link>
              </Button>
            ) : null}

            <TransferList data={query.data} />
          </>
        ))}
    </PageLayout>
  );
}
