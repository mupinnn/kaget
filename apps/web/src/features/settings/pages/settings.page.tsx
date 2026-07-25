import { PageLayout } from "@/components/page-layout";
import { useSettingsQuery } from "../data/settings.queries";

export function SettingsIndexPage() {
  const settingsQuery = useSettingsQuery();

  if (settingsQuery.isPending) return <p>Loading . . .</p>;
  if (settingsQuery.isError) return <p>An error occured: {settingsQuery.error.message}</p>;

  return (
    <PageLayout title="Settings">
      <div className="space-y-2">
        <h2 className="font-semibold text-lg">Currency</h2>
        <p className="text-muted-foreground text-sm">
          Your account currency is synced from the server.
        </p>
        <p className="font-medium">
          {settingsQuery.data?.currencyCode ?? window.settings?.currencyCode}
        </p>
      </div>
    </PageLayout>
  );
}
