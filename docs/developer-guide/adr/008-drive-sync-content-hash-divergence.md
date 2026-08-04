# Drive sync divergence via content_hash; cursor outside the ledger

Whole-file Sync between the Working ledger and the Drive Ledger document detects change with **payload `content_hash` only** — not Drive `modifiedTime` or document `revised_at` (those false-conflict after our own push or a timestamp-only bump). The last-synced hash cursor lives in Dexie **outside** the hashed ledger payload so updating it cannot flip “local changed.” First link with no cursor: empty/stub remote → push; identical hashes → idle; both real and different → Sync conflict (never auto-pull).

**Status:** Accepted  
**Date:** 2026-08-04  
**PRD:** [001-local-first-drive-sync](../prd/001-local-first-drive-sync.md)  
**Supplements:** [ADR-007](./007-local-first-drive-custodian-boundary.md)

## Considered options

| Option | Why not (v1) |
|--------|----------------|
| Drive `modifiedTime` / `revised_at` as change signal | False conflicts after self-push or timestamp bumps. |
| Cursor inside exported settings / payload | Updating the cursor changes `content_hash` and breaks the matrix. |
| Auto-pull on first connect when remote exists | Silent clobber; contradicts ADR-007 conflict policy. |
