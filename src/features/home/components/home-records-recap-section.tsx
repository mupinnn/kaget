import { Link } from "@tanstack/react-router";
import { ArrowRightLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency } from "@/utils/common.util";
import { cn } from "@/libs/utils.lib";
import { HomeSection } from "./home-section";

const records = Array.from({ length: 10 }).map((_, i) => {
  const randomRecordType = Math.random() > 0.5 ? "INCOME" : "EXPENSE";
  return {
    id: i,
    note: `I'm an ${randomRecordType}`,
    amount: 15000 + i + 1,
    source_id: 1,
    source_type: "WALLET",
    balance_type: "CASH",
    record_type: randomRecordType,
  };
});

export const HomeRecordsRecapSection = () => {
  return (
    <HomeSection title="Today's recap" to="/records" linkText="See all records">
      {records.length === 0 ? (
        <EmptyState
          title="No records today"
          description="Don't forget to record every money you spend or get. It's precious."
          icon={ArrowRightLeftIcon}
          actions={
            <Button asChild className="no-underline">
              <Link to="/records">Record cashflow</Link>
            </Button>
          }
        />
      ) : (
        <div className="divide-y">
          {records.map(record => {
            const isIncome = record.record_type === "INCOME";
            return (
              <div className="flex items-center justify-between py-2 text-sm" key={record.id}>
                <div className="space-y-1">
                  <p>{record.note}</p>
                  <p className="text-xs">
                    {record.source_type} - {record.balance_type}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className={cn(isIncome ? "text-success" : "text-destructive")}>
                    {isIncome ? "+" : "-"}
                    {formatCurrency(record.amount)}
                  </p>
                  <p className="text-xs">{new Date().toDateString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </HomeSection>
  );
};
