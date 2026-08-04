# PRD: Local-first ledger + optional Google Drive sync

**Status:** Done (v1 hardening 2026-08-04)  
**Glossary:** [`CONTEXT.md`](../../../CONTEXT.md)  
**ADR:** [ADR-007](../adr/007-local-first-drive-custodian-boundary.md)  
**Tracking:** [Wayfinder map #30](https://github.com/mupinnn/kaget/issues/30)

## Problem

KaGet’s product spine is **envelope allocation** (money moves from a Wallet into a Budget/Goal before spending). Today the working copy lives in Dexie, but docs and API surface still imply (or allow) server-hosted domain data. The maintainer is **not ready to be a custodian** of users’ financial ledgers (ops, incidents, restore, encryption proofs).

Users need durable backup and multi-device potential **without** KaGet storing Wallets, Records, Budgets, Transfers, or Debts/Loans.

## Goals

1. **Custodian boundary** — KaGet never persists financial ledger data. Postgres may hold session, Google OAuth tokens, and a Drive `fileId` pointer only.
2. **Local-first** — Dexie remains the day-to-day engine for envelope rules and balances. Offline works without Google.
3. **Optional Drive sync** — User-visible ledger file on Google Drive; connect is opt-in.
4. **Safe conflicts** — Never silent last-write-wins; on divergence, user chooses keep local / keep remote (and can export).
5. **Agent-trackable delivery** — This PRD in-repo; wayfinder map + child tickets for execution.
6. **Docs fresh start** — User/developer docs and ADRs reflect this architecture; remove or rewrite misleading “KaGet hosts your data / syncs via account” language.

## Non-goals (v1)

- Client-side encrypt-before-upload (deferred; Google’s account encryption only).
- Google Sheets as the live database.
- Record-level sync merge.
- Email/password auth.
- Full visual / IA redesign (separate later session). Ship **minimal** Connect Drive / Sync / conflict UI only.
- Household / multi-user ledgers.

## Product invariant (must not change)

Envelope allocation stays:

- **Wallet** — real-world money account.
- **Budget** — spending envelope funded from a Wallet.
- **Goal** — saving envelope; spend locked until funded.
- **Record** — income/expense against a source (Wallet or Budget/Goal).
- **Transfer** — internal movement between holders.

See `CONTEXT.md`.

## Architecture (v1)

```
┌─────────────────────────────────────────────────────────┐
│  PWA                                                     │
│  Dexie = working ledger (canonical for rules/balances)   │
│  Import/Export JSON ↔ same schema as Drive file          │
└─────────────┬───────────────────────────▲────────────────┘
              │ sync (opt-in)             │
              ▼                           │
┌─────────────────────┐         ┌─────────┴──────────────┐
│  Google Drive       │         │  apps/api              │
│  Visible file       │◄────────│  Google session        │
│  kaget ledger JSON  │  broker │  refresh tokens        │
└─────────────────────┘         │  fileId pointer        │
                                │  NO ledger tables      │
                                └────────────────────────┘
```

| Layer | Role |
|-------|------|
| Dexie + `*.services.ts` | Domain engine; source of truth while using the app |
| Drive file | Optional durable copy; single versioned JSON (evolve export format) |
| API | Google sign-in when enabling sync; token broker; Drive proxy; store `fileId` only |

### Auth

- **Local use:** no login.
- **Drive sync:** Google OAuth only (no email/password).
- Enabling sync creates/uses a KaGet session backed by Google — not a separate password account.

### Drive file

- **Format:** Evolve today’s export JSON (`version`, settings, wallets, records, budgets, transfers, debts/loans, …) plus sync metadata (`revised_at`, content hash, etc.).
- **Location:** Visible under My Drive (fixed path convention, e.g. `KaGet/kaget-ledger.json`); API stores `fileId` so renames don’t break sync. Relocate later is optional follow-up.
- **Not Sheets.**

### Conflict policy

If remote changed since last successful sync and local also changed: **block auto-apply**. User picks:

1. Keep local (overwrite remote), or  
2. Keep remote (replace local),  

and can export first. No silent whole-file LWW.

## Success criteria (v1 “done”)

- [x] Local envelope flows work without Google.
- [x] Settings: Connect / Disconnect Google Drive; Sync now; last-synced status.
- [x] Upload/download of the ledger file via API broker.
- [x] Conflict UI: choose local / remote (+ export path).
- [x] API persists **no** financial entities; domain routes/tables removed or never shipped.
- [x] Export/import and Drive document share one schema family; Debts & Loans included.
- [x] Docs + ADR-007 match this PRD; stale “server ledger / account sync” copy gone.
- [x] Wayfinder map + child tickets cover the work; agents can claim `ready-for-agent` slices.

**Residual fog (out of v1 CI):** end-to-end Sync / conflict against a real Google account is manual — unit + API integration cover broker, strip-domain, and conflict engine; Settings e2e covers signed-out Connect chrome only.

## Phasing

| Phase | Scope |
|-------|--------|
| **0 — Docs & tracking** | PRD, ADR-007, refresh/remove stale docs, wayfinder map + children |
| **1 — API custodian boundary** | Google auth + token broker + Drive proxy + `fileId`; strip domain CRUD/schema |
| **2 — Client sync** | Serialize ledger ↔ export schema; sync engine; conflict handling; minimal Settings UI |
| **3 — Hardening** | Tests, doc polish, export version bumps, edge cases |
| **Later (separate session)** | Full UI/IA redesign; optional client-side encryption; Sheets *export* (not DB) |

## Doc / ADR policy for this revamp

Treat documentation as a **fresh state** aligned to this PRD:

- Prefer rewrite or delete over leaving contradictory guides.
- Feature domain docs (Wallet/Budget rules) stay valuable — frame them as **local domain model**, not Postgres.
- ADRs that still apply (locale, balance cache, cascade delete, tooling, release, deploy) keep; amend where they assumed a server ledger.
- New architecture decisions go in ADR-007+; don’t leave AGENTS.md contradicting the PRD.

## Open follow-ups (out of v1 tickets unless pulled in)

- Client-side encryption threat model and key recovery.
- Finer-grained sync / CRDT-style merge (unlikely for envelopes).
- User-chosen Drive folder beyond the default path.
- Full UI redesign session.
