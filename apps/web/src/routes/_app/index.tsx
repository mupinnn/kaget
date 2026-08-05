import { createFileRoute } from "@tanstack/react-router";
import { DriveConnectBanner } from "@/features/home/components/drive-connect-banner";
import { HomeBudgetsSection } from "@/features/home/components/home-budgets-section";
import { HomeRecordsRecapSection } from "@/features/home/components/home-records-recap-section";
import { HomeWalletsSection } from "@/features/home/components/home-wallets-section";

export const Route = createFileRoute("/_app/")({
  component: IndexPage,
});

function IndexPage() {
  return (
    <div className="flex flex-col gap-6">
      <DriveConnectBanner />
      <HomeWalletsSection />
      <HomeBudgetsSection />
      <HomeRecordsRecapSection />
    </div>
  );
}
