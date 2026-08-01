# Local-first ledger; Google Drive optional; API is not a financial custodian

KaGet’s financial ledger (Wallets, Records, Budgets/Goals, Transfers, Debts/Loans) lives in the **client** (Dexie) as the working copy. Optional durability and multi-device backup use a **single user-visible JSON file on the user’s Google Drive**, in the same schema family as import/export. `apps/api` may store **Google session, OAuth refresh tokens, and a Drive file id pointer only** — never ledger rows. No email/password auth; local use needs no login. Sync conflicts never auto-clobber: the user chooses keep-local or keep-remote. Client-side encrypt-before-upload and Sheets-as-database were rejected for v1.

**Status:** Accepted  
**Date:** 2026-08-01  
**PRD:** [001-local-first-drive-sync](../prd/001-local-first-drive-sync.md)

## Considered options

| Option | Why not (v1) |
|--------|----------------|
| Postgres domain CRUD | Makes KaGet a financial-data custodian (ops, incidents, trust). |
| Google Sheets as live DB | Fights envelope invariants, migrations, and validation. |
| Drive-first / no local engine | Poor offline; Drive is not a transactional domain store. |
| Client-side encryption before upload | Correct long-term privacy bar, but key recovery and threat modeling deferred; Google account encryption suffices while we refuse to host the ledger. |
| Whole-file last-write-wins | Silent data loss for personal finance. |

## Consequences

- Domain rules and balance ADRs (e.g. ADR-002, ADR-003) apply to the **client** domain engine, not to API tables.
- Deployed Postgres shrinks toward auth/token/pointer data; domain migrations/routes must be removed or never added.
- Minimal Sync/Connect UI is required for the architecture to be usable; full visual redesign is out of scope for this decision.
