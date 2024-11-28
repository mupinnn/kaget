import { getRouteApi } from "@tanstack/react-router";
import { PageLayout } from "@/components/page-layout";
import { formatCurrency } from "@/utils/common.util";
import { useRecordDetailQuery } from "../data/records.queries";
import { cn } from "@/libs/utils.lib";

const route = getRouteApi("/records/$recordId");

export function RecordsDetailPage() {
  const { recordId } = route.useParams();
  const recordDetailQuery = useRecordDetailQuery(recordId);

  if (recordDetailQuery.isPending) return <p>Loading . . .</p>;
  if (recordDetailQuery.isError) return <p>An error occured: {recordDetailQuery.error.message}</p>;

  return (
    <PageLayout
      title={recordDetailQuery.data.data.note}
      subtitle={formatCurrency(recordDetailQuery.data.data.amount)}
      subtitleClassName="text-lg"
    >
      <div className="divide-y">
        {recordDetailQuery.data.data.items.map(item => {
          const isIncome = recordDetailQuery.data.data.record_type === "INCOME";
          return (
            <div key={item.id} className="flex items-center justify-between py-2 text-sm">
              <p>{item.note}</p>
              <p className={cn("text-right", isIncome ? "text-success" : "text-destructive")}>
                {isIncome ? "+" : "-"}
                {formatCurrency(item.amount)}
              </p>
            </div>
          );
        })}
      </div>
    </PageLayout>
  );
}
