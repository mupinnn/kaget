import { PageLayout } from "@/components/page-layout";
import { GoogleAuthControls } from "@/features/auth/components/google-auth-controls";
import { useSession } from "@/libs/auth.lib";
import { useSettingsQuery } from "../data/settings.queries";

export function SettingsIndexPage() {
  const session = useSession();
  const isAuthenticated = Boolean(session.data?.session);
  const settingsQuery = useSettingsQuery({
    enabled: isAuthenticated,
  });

  return (
    <PageLayout title="Settings">
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="font-semibold text-lg">Google account</h2>
          <p className="text-muted-foreground text-sm">
            Optional. Sign in with Google to enable Drive backup later. Local use needs no login.
          </p>
          <GoogleAuthControls />
        </div>

        <div className="space-y-2">
          <h2 className="font-semibold text-lg">Currency</h2>
          {!isAuthenticated ? (
            <p className="text-muted-foreground text-sm">
              Currency preferences stay on this device once local settings return. Sign in only for
              cloud features.
            </p>
          ) : settingsQuery.isPending ? (
            <p>Loading . . .</p>
          ) : settingsQuery.isError ? (
            <p>An error occured: {settingsQuery.error.message}</p>
          ) : (
            <>
              <p className="text-muted-foreground text-sm">
                Your account currency is loaded from the server while the ledger still uses API
                storage.
              </p>
              <p className="font-medium">
                {settingsQuery.data?.currencyCode ?? window.settings?.currencyCode}
              </p>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
