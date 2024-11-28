import { Link } from "@tanstack/react-router";
import { PlusIcon, ArrowRightLeftIcon } from "lucide-react";
import { P, match } from "ts-pattern";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { PageLayout } from "@/components/page-layout";
import { formatCurrency, formatDate } from "@/utils/common.util";
import { cn } from "@/libs/utils.lib";
import { useRecordsQuery } from "../data/records.queries";

const loaders = Array.from({ length: 5 }).map((_, i) => (
  <Skeleton key={i} className="h-24 w-full" />
));

export function RecordsIndexPage() {
  const recordsQuery = useRecordsQuery();

  return (
    <PageLayout
      title="Records"
      subtitle="Adulting is not about spending, but tracking and controlling what you spend"
    >
      <Button asChild className="no-underline">
        <Link to="/records/create">
          <PlusIcon />
          New record
        </Link>
      </Button>

      <div className="divide-y">
        {match(recordsQuery)
          .with({ isPending: true }, () => loaders)
          .with({ isError: true }, () => <p>An error occured</p>)
          .with({ data: P.select(P.when(data => data.data.length === 0)) }, () => (
            <EmptyState
              title="No record created"
              description="You have not record any transaction. Record one above."
              icon={ArrowRightLeftIcon}
            />
          ))
          .otherwise(() =>
            recordsQuery.data?.data.map(record => {
              const isIncome = record.record_type === "INCOME";
              return (
                <Link
                  to="/records/$recordId"
                  params={{ recordId: record.id }}
                  className="flex items-center justify-between py-2 text-sm no-underline"
                  key={record.id}
                >
                  <div className="space-y-1">
                    <p>{record.note}</p>
                    <p className="text-xs">
                      {record.source.name} - {record.source_type}
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className={cn(isIncome ? "text-success" : "text-destructive")}>
                      {isIncome ? "+" : "-"}
                      {formatCurrency(record.amount)}
                    </p>
                    <p className="text-xs">{formatDate(record.recorded_at)}</p>
                  </div>
                </Link>
              );
            })
          )}
      </div>
    </PageLayout>
  );
}
