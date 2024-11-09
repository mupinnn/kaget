import { createFileRoute } from "@tanstack/react-router";
import { HomeWalletsSection } from "@/features/home/components/home-wallets-section";
import { HomeBudgetsSection } from "@/features/home/components/home-budgets-section";
import { HomeRecordsRecapSection } from "@/features/home/components/home-records-recap-section";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  return (
    <div className="flex flex-col gap-10">
      <HomeWalletsSection />
      <HomeBudgetsSection />
      <HomeRecordsRecapSection />
    </div>
  );
}
