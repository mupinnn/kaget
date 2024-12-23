import { getRouteApi } from "@tanstack/react-router";
import { PageLayout } from "@/components/page-layout";
import { formatCurrency } from "@/utils/common.util";
import { useBudgetDetailQuery } from "../data/budgets.queries";

const route = getRouteApi("/budgets/$budgetId");

export function BudgetsDetailPage() {
  const { budgetId } = route.useParams();
  const budgetDetailQuery = useBudgetDetailQuery(budgetId);

  if (budgetDetailQuery.isPending) return <p>Loading . . .</p>;
  if (budgetDetailQuery.isError) return <p>An error occured: {budgetDetailQuery.error.message}</p>;

  const budgetDetail = budgetDetailQuery.data.data;

  return (
    <PageLayout title={budgetDetail.name} badge="BUDGET">
      <p>Somethin</p>
    </PageLayout>
  );
}
