import { signInWithGoogle, signOut } from "@/libs/auth.lib";
import { getSession, isAuthenticatedSession } from "@/libs/session.lib";
import {
  createApiDriveLedgerRemote,
  ensureDriveLedger,
  unbindDriveLedger,
} from "./drive-ledger.remote";
import {
  type DriveSyncDeps,
  resolveConflict as resolveConflictWithDeps,
  syncNow as syncNowWithDeps,
} from "./drive-sync.engine";
import { DriveSyncNotConnectedError } from "./drive-sync.errors";
import { clearDriveSyncCursor, getDriveSyncCursor, setDriveSyncCursor } from "./drive-sync.meta";
import type { SyncConflictChoice, SyncNowResult } from "./drive-sync.schemas";
import { buildLocalLedgerDocument, replaceLocalLedgerFromDocument } from "./ledger-ie.services";

export {
  classifyRemoteContent,
  type DriveSyncDeps,
  decideSyncAction,
} from "./drive-sync.engine";
export {
  clearDriveSyncCursor,
  getDriveSyncCursor,
  getDriveSyncMeta,
  setDriveSyncCursor,
} from "./drive-sync.meta";
export type { SyncConflictChoice, SyncNowResult } from "./drive-sync.schemas";
export { DriveSyncNotConnectedError };

/** sessionStorage flag: finish Connect (ensure) after Google OAuth redirect. */
export const PENDING_DRIVE_CONNECT_KEY = "kaget:pendingDriveConnect";

export type ConnectDriveResult = { status: "connected" } | { status: "redirecting" };

export function createDefaultDriveSyncDeps(): DriveSyncDeps {
  return {
    async requireConnected() {
      const session = await getSession();
      if (!isAuthenticatedSession(session)) {
        throw new DriveSyncNotConnectedError();
      }
    },
    getLocalDocument: buildLocalLedgerDocument,
    replaceLocalDocument: replaceLocalLedgerFromDocument,
    getCursor: getDriveSyncCursor,
    setCursor: setDriveSyncCursor,
    remote: createApiDriveLedgerRemote(),
  };
}

export async function syncNow(
  deps: DriveSyncDeps = createDefaultDriveSyncDeps()
): Promise<SyncNowResult> {
  return syncNowWithDeps(deps);
}

export async function resolveConflict(
  choice: SyncConflictChoice,
  deps: DriveSyncDeps = createDefaultDriveSyncDeps()
): Promise<SyncNowResult> {
  return resolveConflictWithDeps(choice, deps);
}

/**
 * Connect Google Drive: Google sign-in (if needed) + ensure ledger file binding.
 * Does not run Sync — user must tap Sync now.
 */
export async function connectDrive(): Promise<ConnectDriveResult> {
  const session = await getSession();
  if (!isAuthenticatedSession(session)) {
    sessionStorage.setItem(PENDING_DRIVE_CONNECT_KEY, "1");
    const { error } = await signInWithGoogle("/settings");
    if (error) {
      sessionStorage.removeItem(PENDING_DRIVE_CONNECT_KEY);
      throw new Error(error.message ?? "Google sign-in failed");
    }
    return { status: "redirecting" };
  }

  await ensureDriveLedger();
  return { status: "connected" };
}

/** After OAuth return: ensure Drive binding if Connect started the redirect. */
export async function finishPendingDriveConnect(): Promise<boolean> {
  if (sessionStorage.getItem(PENDING_DRIVE_CONNECT_KEY) !== "1") {
    return false;
  }

  const session = await getSession();
  if (!isAuthenticatedSession(session)) {
    return false;
  }

  sessionStorage.removeItem(PENDING_DRIVE_CONNECT_KEY);
  await ensureDriveLedger();
  return true;
}

/**
 * Disconnect: unbind fileId, clear Dexie sync cursor, sign out.
 * Local ledger data remains on device.
 */
export async function disconnectDrive(): Promise<void> {
  await unbindDriveLedger();
  await clearDriveSyncCursor();
  const { error } = await signOut();
  if (error) {
    throw new Error(error.message ?? "Sign out failed");
  }
}
