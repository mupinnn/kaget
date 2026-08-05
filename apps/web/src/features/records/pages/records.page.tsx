import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { match } from "ts-pattern";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { RecordList, RecordListLoader } from "../components/record-list";
import { useRecordsQuery } from "../data/records.queries";

function RecordsQueryError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-dashed px-3 py-4 text-muted-foreground text-sm">
      Couldn&apos;t load records.{" "}
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

export function RecordsIndexPage() {
  const recordsQuery = useRecordsQuery();
  const hasRecords = (recordsQuery.data?.length ?? 0) > 0;

  return (
    <PageLayout
      title="Records"
      subtitle="Income and expenses against wallets or budgets on this device."
    >
      {match(recordsQuery)
        .with({ isPending: true }, () => <RecordListLoader />)
        .with({ isError: true }, () => (
          <RecordsQueryError onRetry={() => void recordsQuery.refetch()} />
        ))
        .otherwise(query => (
          <>
            {hasRecords ? (
              <Button asChild className="no-underline" size="sm">
                <Link to="/records/create">
                  <PlusIcon />
                  New record
                </Link>
              </Button>
            ) : null}

            <RecordList data={query.data} />
          </>
        ))}
    </PageLayout>
  );
}
