export const DRIVE_SYNC_META_ID = "local" as const;

/** Dexie row for Sync cursor — outside the hashed Ledger document (ADR-008). */
export type DriveSyncMeta = {
  id: typeof DRIVE_SYNC_META_ID;
  lastSyncedContentHash: string;
  lastSyncedAt: Date;
};

export type SyncConflictChoice = "local" | "remote";

export type SyncNowResult =
  | {
      status: "idle";
      contentHash: string;
    }
  | {
      status: "pushed";
      contentHash: string;
    }
  | {
      status: "pulled";
      contentHash: string;
    }
  | {
      status: "conflict";
      localContentHash: string;
      remoteContentHash: string;
    };

export type SyncAction = "idle" | "push" | "pull" | "conflict";
