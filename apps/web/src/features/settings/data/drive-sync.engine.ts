import type { SyncAction, SyncConflictChoice, SyncNowResult } from "./drive-sync.schemas";
import {
  InvalidLedgerDocumentError,
  LedgerDocumentHashMismatchError,
  parseLedgerDocument,
  UnsupportedLedgerDocumentVersionError,
} from "./ledger-document";
import type { LedgerDocument } from "./ledger-document.schemas";

export type DriveLedgerRemote = {
  ensure: () => Promise<void>;
  download: () => Promise<unknown>;
  upload: (document: LedgerDocument) => Promise<void>;
};

export type DriveSyncDeps = {
  requireConnected: () => Promise<void>;
  getLocalDocument: () => Promise<LedgerDocument>;
  replaceLocalDocument: (document: LedgerDocument) => Promise<void>;
  getCursor: () => Promise<string | null>;
  setCursor: (contentHash: string) => Promise<void>;
  remote: DriveLedgerRemote;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Classify Drive file body: empty stub → absent; valid ledger → present;
 * unsupported/corrupt versioned doc → throw (do not silent-overwrite).
 */
export async function classifyRemoteContent(
  content: unknown
): Promise<{ kind: "absent" } | { kind: "present"; document: LedgerDocument }> {
  if (!isRecord(content) || Object.keys(content).length === 0) {
    return { kind: "absent" };
  }

  try {
    const document = await parseLedgerDocument(content);
    return { kind: "present", document };
  } catch (error) {
    if (
      error instanceof UnsupportedLedgerDocumentVersionError ||
      error instanceof LedgerDocumentHashMismatchError ||
      (error instanceof InvalidLedgerDocumentError && "version" in content)
    ) {
      throw error;
    }
    return { kind: "absent" };
  }
}

/**
 * Pure Sync matrix (ADR-008). `lastSynced` null means no cursor yet.
 */
export function decideSyncAction(input: {
  localHash: string;
  remoteHash: string | null;
  lastSynced: string | null;
}): SyncAction {
  const { localHash, remoteHash, lastSynced } = input;

  if (remoteHash === null) {
    return "push";
  }

  if (localHash === remoteHash) {
    return "idle";
  }

  if (lastSynced === null) {
    return "conflict";
  }

  const localChanged = localHash !== lastSynced;
  const remoteChanged = remoteHash !== lastSynced;

  if (!localChanged && remoteChanged) {
    return "pull";
  }
  if (localChanged && !remoteChanged) {
    return "push";
  }
  if (localChanged && remoteChanged) {
    return "conflict";
  }

  return "idle";
}

export async function syncNow(deps: DriveSyncDeps): Promise<SyncNowResult> {
  await deps.requireConnected();
  await deps.remote.ensure();

  const local = await deps.getLocalDocument();
  const lastSynced = await deps.getCursor();
  const remoteContent = await deps.remote.download();
  const remote = await classifyRemoteContent(remoteContent);

  const action = decideSyncAction({
    localHash: local.content_hash,
    remoteHash: remote.kind === "present" ? remote.document.content_hash : null,
    lastSynced,
  });

  switch (action) {
    case "idle": {
      await deps.setCursor(local.content_hash);
      return { status: "idle", contentHash: local.content_hash };
    }
    case "push": {
      await deps.remote.upload(local);
      await deps.setCursor(local.content_hash);
      return { status: "pushed", contentHash: local.content_hash };
    }
    case "pull": {
      if (remote.kind !== "present") {
        throw new InvalidLedgerDocumentError("Cannot pull: remote ledger is absent");
      }
      await deps.replaceLocalDocument(remote.document);
      await deps.setCursor(remote.document.content_hash);
      return { status: "pulled", contentHash: remote.document.content_hash };
    }
    case "conflict": {
      if (remote.kind !== "present") {
        throw new InvalidLedgerDocumentError("Cannot conflict: remote ledger is absent");
      }
      return {
        status: "conflict",
        localContentHash: local.content_hash,
        remoteContentHash: remote.document.content_hash,
      };
    }
  }
}

export async function resolveConflict(
  choice: SyncConflictChoice,
  deps: DriveSyncDeps
): Promise<SyncNowResult> {
  await deps.requireConnected();
  await deps.remote.ensure();

  if (choice === "local") {
    const local = await deps.getLocalDocument();
    await deps.remote.upload(local);
    await deps.setCursor(local.content_hash);
    return { status: "pushed", contentHash: local.content_hash };
  }

  const remoteContent = await deps.remote.download();
  const remote = await classifyRemoteContent(remoteContent);
  if (remote.kind !== "present") {
    throw new InvalidLedgerDocumentError("Cannot keep remote: Drive ledger is absent or invalid");
  }
  await deps.replaceLocalDocument(remote.document);
  await deps.setCursor(remote.document.content_hash);
  return { status: "pulled", contentHash: remote.document.content_hash };
}
