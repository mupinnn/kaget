import { match } from "ts-pattern";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { BudgetList } from "@/features/budgets/components/budget-list";
import { useBudgetsQuery } from "@/features/budgets/data/budgets.queries";
import { HomeSection } from "./home-section";
import { HomePeekLoader, HomeSectionError } from "./home-section-status";

export function HomeBudgetsSection() {
  const budgetsQuery = useBudgetsQuery({ limit: 5 });

  return (
    <HomeSection
      title="Budgets"
      description="Envelope allocations from your wallets"
      to="/budgets"
      linkText="See all"
    >
      {match(budgetsQuery)
        .with({ isPending: true }, () => <HomePeekLoader />)
        .with({ isError: true }, () => (
          <HomeSectionError onRetry={() => void budgetsQuery.refetch()} />
        ))
        .otherwise(query =>
          query.data.length === 0 ? (
            <BudgetList
              data={query.data}
              emptyMessageTitle="No budgets yet"
              emptyMessageDescription="Move money from a wallet into an envelope so spending stays intentional."
            />
          ) : (
            <ScrollArea className="-mb-0.5 -ml-0.5">
              <div className="flex w-max min-w-full gap-3 pb-0.5 pl-0.5 [&>*]:w-56 [&>*]:shrink-0">
                <BudgetList data={query.data} />
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )
        )}
    </HomeSection>
  );
}
