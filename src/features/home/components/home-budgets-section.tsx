import { match } from "ts-pattern";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { BudgetList, BudgetListLoader } from "@/features/budgets/components/budget-list";
import { useBudgetsQuery } from "@/features/budgets/data/budgets.queries";
import { HomeSection } from "./home-section";

export const HomeBudgetsSection = () => {
  const budgetsQuery = useBudgetsQuery({ limit: 5 });

  return (
    <HomeSection title="Budgets" to="/budgets" linkText="See all budgets">
      <ScrollArea className="-mb-0.5 -ml-0.5">
        <div className="flex w-max space-x-4 pb-0.5 pl-0.5">
          {match(budgetsQuery)
            .with({ isPending: true }, () => <BudgetListLoader />)
            .with({ isError: true }, () => <p>An error occured</p>)
            .otherwise(budgetsQuery => (
              <BudgetList data={budgetsQuery.data.data} />
            ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </HomeSection>
  );
};
