import {
  DRIVE_SYNC_META_ID,
  type DriveSyncMeta,
} from "@/features/settings/data/drive-sync.schemas";
import { db } from "@/libs/db.lib";

export async function getDriveSyncCursor(): Promise<string | null> {
  const row = await db.driveSyncMeta.get(DRIVE_SYNC_META_ID);
  return row?.lastSyncedContentHash ?? null;
}

export async function getDriveSyncMeta(): Promise<DriveSyncMeta | undefined> {
  return db.driveSyncMeta.get(DRIVE_SYNC_META_ID);
}

export async function setDriveSyncCursor(
  contentHash: string,
  syncedAt = new Date()
): Promise<void> {
  const row: DriveSyncMeta = {
    id: DRIVE_SYNC_META_ID,
    lastSyncedContentHash: contentHash,
    lastSyncedAt: syncedAt,
  };
  await db.driveSyncMeta.put(row);
}

/** Clears last-synced cursor (e.g. after manual import). */
export async function clearDriveSyncCursor(): Promise<void> {
  await db.driveSyncMeta.delete(DRIVE_SYNC_META_ID);
}
