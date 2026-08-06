import { CloudIcon, CloudOffIcon, RefreshCwIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useSession } from "@/libs/auth.lib";
import { formatDate } from "@/utils/date.util";
import {
  useConnectDriveMutation,
  useDisconnectDriveMutation,
  useFinishPendingDriveConnectMutation,
  useResolveConflictMutation,
  useSyncNowMutation,
} from "../data/drive-sync.mutations";
import { useDriveSyncMetaQuery } from "../data/drive-sync.queries";
import type { SyncNowResult } from "../data/drive-sync.schemas";
import { PENDING_DRIVE_CONNECT_KEY } from "../data/drive-sync.services";

export const SETTINGS_EXPORT_SECTION_ID = "settings-export";
/** Anchor for home banner / deep-links into Settings → Google Drive. */
export const SETTINGS_DRIVE_SECTION_ID = "settings-google-drive";

type ConflictState = Extract<SyncNowResult, { status: "conflict" }>;

function syncSuccessMessage(result: Exclude<SyncNowResult, { status: "conflict" }>): string {
  switch (result.status) {
    case "idle":
      return "Already in sync";
    case "pushed":
      return "Uploaded local ledger to Drive";
    case "pulled":
      return "Downloaded ledger from Drive";
  }
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function scrollToExportSection() {
  scrollToSection(SETTINGS_EXPORT_SECTION_ID);
}

export function GoogleDriveSyncSection() {
  const session = useSession();
  const user = session.data?.user;
  const metaQuery = useDriveSyncMetaQuery();
  const connectMutation = useConnectDriveMutation();
  const finishPendingMutation = useFinishPendingDriveConnectMutation();
  const disconnectMutation = useDisconnectDriveMutation();
  const syncMutation = useSyncNowMutation();
  const resolveMutation = useResolveConflictMutation();
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const pendingConnectAttempted = useRef(false);

  useEffect(() => {
    if (window.location.hash !== `#${SETTINGS_DRIVE_SECTION_ID}`) {
      return;
    }
    // Defer so layout is ready after Settings mount.
    const frame = requestAnimationFrame(() => scrollToSection(SETTINGS_DRIVE_SECTION_ID));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (session.isPending || !user || pendingConnectAttempted.current) {
      return;
    }
    if (sessionStorage.getItem(PENDING_DRIVE_CONNECT_KEY) !== "1") {
      return;
    }

    pendingConnectAttempted.current = true;
    finishPendingMutation.mutate(undefined, {
      onSuccess: didConnect => {
        if (didConnect) {
          toast("Google Drive connected");
        }
      },
      onError: () => {
        pendingConnectAttempted.current = false;
      },
    });
  }, [session.isPending, user, finishPendingMutation.mutate]);

  const isBusy =
    connectMutation.isPending ||
    finishPendingMutation.isPending ||
    disconnectMutation.isPending ||
    syncMutation.isPending ||
    resolveMutation.isPending;

  const handleConnect = () => {
    connectMutation.mutate(undefined, {
      onSuccess: result => {
        if (result.status === "connected") {
          toast("Google Drive connected");
        }
      },
    });
  };

  const handleSyncNow = () => {
    syncMutation.mutate(undefined, {
      onSuccess: result => {
        if (result.status === "conflict") {
          setConflict(result);
          toast("Sync conflict", {
            description: "Local and Drive ledgers both changed. Choose which copy to keep.",
          });
          return;
        }
        setConflict(null);
        toast(syncSuccessMessage(result));
      },
    });
  };

  const handleResolve = (choice: "local" | "remote") => {
    resolveMutation.mutate(choice, {
      onSuccess: () => {
        setConflict(null);
        toast(
          choice === "local"
            ? "Kept local ledger and uploaded to Drive"
            : "Kept Drive ledger and replaced local data"
        );
      },
    });
  };

  if (session.isPending) {
    return (
      <section id={SETTINGS_DRIVE_SECTION_ID} className="scroll-mt-4 space-y-2">
        <div className="space-y-0.5">
          <h2 className="font-semibold text-base tracking-tight">Google Drive</h2>
          <p className="text-muted-foreground text-sm">Loading account…</p>
        </div>
      </section>
    );
  }

  return (
    <section id={SETTINGS_DRIVE_SECTION_ID} className="scroll-mt-4 space-y-3">
      <div className="space-y-0.5">
        <h2 className="font-semibold text-base tracking-tight">Google Drive</h2>
        <p className="text-muted-foreground text-sm">
          Optional backup on your Drive. Local use needs no login — currency and backup always work
          offline.
        </p>
      </div>

      {!user ? (
        <Button type="button" variant="outline" size="sm" disabled={isBusy} onClick={handleConnect}>
          <CloudIcon />
          {connectMutation.isPending ? "Connecting…" : "Connect Google Drive"}
        </Button>
      ) : (
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">{user.email}</p>

          <p className="text-sm">
            Last synced:{" "}
            {metaQuery.isPending ? (
              <span className="text-muted-foreground">Loading…</span>
            ) : metaQuery.data?.lastSyncedAt ? (
              <span className="font-medium">
                {formatDate(metaQuery.data.lastSyncedAt, { timeStyle: "short" })}
              </span>
            ) : (
              <span className="text-muted-foreground">Never</span>
            )}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={handleSyncNow}
            >
              <RefreshCwIcon />
              {syncMutation.isPending ? "Syncing…" : "Sync now"}
            </Button>

            <ConfirmationDialog
              title="Disconnect Google Drive?"
              description="KaGet will stop syncing and sign you out. Your local ledger stays on this device. The file on Drive is not deleted."
              actionLabel="Disconnect"
              trigger={
                <Button type="button" variant="outline" size="sm" disabled={isBusy}>
                  <CloudOffIcon />
                  Disconnect
                </Button>
              }
              onClickAction={() => disconnectMutation.mutate()}
            />
          </div>

          {conflict ? (
            <Alert>
              <AlertTitle>Sync conflict</AlertTitle>
              <AlertDescription>
                <p>
                  This device and Drive both changed since the last sync. Choose which ledger to
                  keep. Navigating away clears this choice — Sync again to re-detect.
                </p>
                <p className="mt-2">
                  Tip:{" "}
                  <button
                    type="button"
                    className="underline underline-offset-2"
                    onClick={scrollToExportSection}
                  >
                    Export a local backup first
                  </button>{" "}
                  if you are unsure (optional).
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => handleResolve("local")}
                  >
                    {resolveMutation.isPending ? "Applying…" : "Keep local"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => handleResolve("remote")}
                  >
                    Keep remote
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      )}
    </section>
  );
}
