import { getSession, isAuthenticatedSession } from "@/libs/session.lib";
import { createApiDriveLedgerRemote } from "./drive-ledger.remote";
import {
  type DriveSyncDeps,
  resolveConflict as resolveConflictWithDeps,
  syncNow as syncNowWithDeps,
} from "./drive-sync.engine";
import { DriveSyncNotConnectedError } from "./drive-sync.errors";
import { getDriveSyncCursor, setDriveSyncCursor } from "./drive-sync.meta";
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
