import { createFileRoute, Link } from "@tanstack/react-router";
import { WalletIcon, BanknoteIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/common.util";
import { cn } from "@/libs/utils.lib";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

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

function IndexPage() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Wallets</h3>
          <Link to="/wallets">See all wallets</Link>
        </div>
        <EmptyState
          title="No wallet created"
          description="Create your first wallet to start tracking your cashflow!"
          icon={WalletIcon}
          actions={
            <Button asChild className="no-underline">
              <Link to="/wallets">Create wallet</Link>
            </Button>
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Budgets</h3>
          <Link to="/budgets" className="text-sm">
            See all budgets
          </Link>
        </div>
        <EmptyState
          title="No budget created"
          description="Allocate your money for a specific occasion."
          icon={BanknoteIcon}
          actions={
            <Button asChild className="no-underline">
              <Link to="/budgets">Create a budget</Link>
            </Button>
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Today&apos;s recap</h3>
          <Link to="/records" className="text-sm">
            See all records
          </Link>
        </div>
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
      </div>
    </div>
  );
}
