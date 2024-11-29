import { getRouteApi } from "@tanstack/react-router";
import { PageLayout } from "@/components/page-layout";
import { formatCurrency } from "@/utils/common.util";
import { useRecordDetailQuery } from "../data/records.queries";

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
      <div className="divide-y"></div>
    </PageLayout>
  );
}
