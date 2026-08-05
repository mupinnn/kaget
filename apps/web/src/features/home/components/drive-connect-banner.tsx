import { Link } from "@tanstack/react-router";
import { CloudIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SETTINGS_DRIVE_SECTION_ID } from "@/features/settings/components/google-drive-sync-section";
import { useSession } from "@/libs/auth.lib";

/** Persist dismiss so the home nudge does not nag forever on this device. */
export const DRIVE_CONNECT_BANNER_DISMISS_KEY = "kaget:drive-connect-banner-dismissed";

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DRIVE_CONNECT_BANNER_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDismissed(value: boolean) {
  try {
    if (value) {
      localStorage.setItem(DRIVE_CONNECT_BANNER_DISMISS_KEY, "1");
    } else {
      localStorage.removeItem(DRIVE_CONNECT_BANNER_DISMISS_KEY);
    }
  } catch {
    // Ignore quota / private-mode failures; banner still works in-session.
  }
}

/**
 * Home nudge when Drive is not connected (signed-out or signed-in without Connect).
 * CTA deep-links to Settings → Google Drive; does not start OAuth.
 */
export function DriveConnectBanner() {
  const session = useSession();
  const [dismissed, setDismissed] = useState(readDismissed);

  const connected = Boolean(session.data?.user);

  useEffect(() => {
    if (!connected) {
      return;
    }
    // Connected users never see the banner; clear dismiss so Disconnect can nudge again.
    writeDismissed(false);
    setDismissed(false);
  }, [connected]);

  if (session.isPending || connected || dismissed) {
    return null;
  }

  const dismiss = () => {
    writeDismissed(true);
    setDismissed(true);
  };

  return (
    <Alert className="relative">
      <CloudIcon />
      <AlertTitle>Optional Google Drive backup</AlertTitle>
      <AlertDescription>
        <p>
          Your ledger stays on this device. Connect Drive in Settings when you want an optional
          backup — no login required to budget.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/settings" hash={SETTINGS_DRIVE_SECTION_ID}>
              Open Settings
            </Link>
          </Button>
          <Button size="sm" type="button" variant="ghost" onClick={dismiss}>
            Dismiss
          </Button>
        </div>
      </AlertDescription>
      <Button
        aria-label="Dismiss Drive backup banner"
        className="absolute top-2 right-2"
        size="icon-xs"
        type="button"
        variant="ghost"
        onClick={dismiss}
      >
        <XIcon />
      </Button>
    </Alert>
  );
}
