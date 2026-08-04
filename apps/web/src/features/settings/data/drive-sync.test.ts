import { describe, expect, test } from "vitest";
import {
  classifyRemoteContent,
  type DriveSyncDeps,
  decideSyncAction,
  resolveConflict,
  syncNow,
} from "./drive-sync.engine";
import { DriveSyncNotConnectedError } from "./drive-sync.errors";
import { buildLedgerDocument, UnsupportedLedgerDocumentVersionError } from "./ledger-document";
import type { LedgerDocument, LedgerDocumentPayload } from "./ledger-document.schemas";

const emptyPayload = (): LedgerDocumentPayload => ({
  settings: { currency_code: "USD" },
  wallets: [],
  budgets: [],
  records: [],
  transfers: [],
  debt_loans: [],
});

const walletPayload = (name: string): LedgerDocumentPayload => ({
  ...emptyPayload(),
  wallets: [
    {
      id: "w1",
      name,
      type: "CASH",
      balance: 100,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
  ],
});

async function doc(payload: LedgerDocumentPayload, revisedAt?: string) {
  return buildLedgerDocument(payload, { revisedAt });
}

function createMemoryDeps(options: {
  local: LedgerDocument;
  remote: unknown;
  cursor?: string | null;
  connected?: boolean;
}): DriveSyncDeps & { remoteStore: { content: unknown }; cursorRef: { value: string | null } } {
  const remoteStore = { content: options.remote };
  const cursorRef = { value: options.cursor === undefined ? null : options.cursor };
  let localDoc = options.local;
  const connected = options.connected ?? true;

  return {
    remoteStore,
    cursorRef,
    async requireConnected() {
      if (!connected) {
        throw new DriveSyncNotConnectedError();
      }
    },
    async getLocalDocument() {
      return localDoc;
    },
    async replaceLocalDocument(document) {
      localDoc = document;
    },
    async getCursor() {
      return cursorRef.value;
    },
    async setCursor(contentHash) {
      cursorRef.value = contentHash;
    },
    remote: {
      async ensure() {},
      async download() {
        return remoteStore.content;
      },
      async upload(document) {
        remoteStore.content = document;
      },
    },
  };
}

describe("decideSyncAction", () => {
  test("absent remote → push", () => {
    expect(decideSyncAction({ localHash: "aaa", remoteHash: null, lastSynced: null })).toBe("push");
    expect(decideSyncAction({ localHash: "aaa", remoteHash: null, lastSynced: "aaa" })).toBe(
      "push"
    );
  });

  test("identical hashes → idle", () => {
    expect(decideSyncAction({ localHash: "aaa", remoteHash: "aaa", lastSynced: null })).toBe(
      "idle"
    );
    expect(decideSyncAction({ localHash: "aaa", remoteHash: "aaa", lastSynced: "bbb" })).toBe(
      "idle"
    );
  });

  test("no cursor + both different → conflict", () => {
    expect(decideSyncAction({ localHash: "aaa", remoteHash: "bbb", lastSynced: null })).toBe(
      "conflict"
    );
  });

  test("matrix with cursor", () => {
    expect(decideSyncAction({ localHash: "aaa", remoteHash: "bbb", lastSynced: "aaa" })).toBe(
      "pull"
    );
    expect(decideSyncAction({ localHash: "bbb", remoteHash: "aaa", lastSynced: "aaa" })).toBe(
      "push"
    );
    expect(decideSyncAction({ localHash: "bbb", remoteHash: "ccc", lastSynced: "aaa" })).toBe(
      "conflict"
    );
    expect(decideSyncAction({ localHash: "aaa", remoteHash: "aaa", lastSynced: "aaa" })).toBe(
      "idle"
    );
  });
});

describe("classifyRemoteContent", () => {
  test("empty stub is absent", async () => {
    await expect(classifyRemoteContent({})).resolves.toEqual({ kind: "absent" });
    await expect(classifyRemoteContent(null)).resolves.toEqual({ kind: "absent" });
  });

  test("valid document is present", async () => {
    const document = await doc(emptyPayload());
    const classified = await classifyRemoteContent(document);
    expect(classified).toEqual({ kind: "present", document });
  });

  test("unsupported version throws", async () => {
    await expect(
      classifyRemoteContent({ version: 1, settings: { currency_code: "USD" } })
    ).rejects.toBeInstanceOf(UnsupportedLedgerDocumentVersionError);
  });
});

describe("syncNow", () => {
  test("pushes when remote is stub", async () => {
    const local = await doc(walletPayload("Local"));
    const deps = createMemoryDeps({ local, remote: {} });

    const result = await syncNow(deps);

    expect(result).toEqual({ status: "pushed", contentHash: local.content_hash });
    expect(deps.remoteStore.content).toEqual(local);
    expect(deps.cursorRef.value).toBe(local.content_hash);
  });

  test("pulls when only remote changed", async () => {
    const base = await doc(walletPayload("Base"));
    const remote = await doc(walletPayload("Remote"));
    const deps = createMemoryDeps({
      local: base,
      remote,
      cursor: base.content_hash,
    });

    const result = await syncNow(deps);

    expect(result).toEqual({ status: "pulled", contentHash: remote.content_hash });
    expect(deps.cursorRef.value).toBe(remote.content_hash);
    expect(await deps.getLocalDocument()).toEqual(remote);
  });

  test("pushes when only local changed", async () => {
    const base = await doc(walletPayload("Base"));
    const local = await doc(walletPayload("Local"));
    const deps = createMemoryDeps({
      local,
      remote: base,
      cursor: base.content_hash,
    });

    const result = await syncNow(deps);

    expect(result).toEqual({ status: "pushed", contentHash: local.content_hash });
    expect(deps.remoteStore.content).toEqual(local);
  });

  test("conflicts when both changed", async () => {
    const base = await doc(walletPayload("Base"));
    const local = await doc(walletPayload("Local"));
    const remote = await doc(walletPayload("Remote"));
    const deps = createMemoryDeps({
      local,
      remote,
      cursor: base.content_hash,
    });

    const result = await syncNow(deps);

    expect(result).toEqual({
      status: "conflict",
      localContentHash: local.content_hash,
      remoteContentHash: remote.content_hash,
    });
    expect(deps.remoteStore.content).toEqual(remote);
    expect(await deps.getLocalDocument()).toEqual(local);
    expect(deps.cursorRef.value).toBe(base.content_hash);
  });

  test("first link with divergent ledgers conflicts", async () => {
    const local = await doc(walletPayload("Local"));
    const remote = await doc(walletPayload("Remote"));
    const deps = createMemoryDeps({ local, remote, cursor: null });

    await expect(syncNow(deps)).resolves.toMatchObject({ status: "conflict" });
  });

  test("identical content idles and writes cursor", async () => {
    const local = await doc(walletPayload("Same"), "2026-01-01T00:00:00.000Z");
    const remote = await doc(walletPayload("Same"), "2026-02-02T00:00:00.000Z");
    expect(local.content_hash).toBe(remote.content_hash);

    const deps = createMemoryDeps({ local, remote, cursor: null });
    const result = await syncNow(deps);

    expect(result).toEqual({ status: "idle", contentHash: local.content_hash });
    expect(deps.cursorRef.value).toBe(local.content_hash);
  });

  test("throws when not connected", async () => {
    const local = await doc(emptyPayload());
    const deps = createMemoryDeps({ local, remote: {}, connected: false });
    await expect(syncNow(deps)).rejects.toBeInstanceOf(DriveSyncNotConnectedError);
  });
});

describe("resolveConflict", () => {
  test("keep local uploads and sets cursor", async () => {
    const local = await doc(walletPayload("Local"));
    const remote = await doc(walletPayload("Remote"));
    const deps = createMemoryDeps({ local, remote, cursor: "old" });

    const result = await resolveConflict("local", deps);

    expect(result).toEqual({ status: "pushed", contentHash: local.content_hash });
    expect(deps.remoteStore.content).toEqual(local);
    expect(deps.cursorRef.value).toBe(local.content_hash);
  });

  test("keep remote replaces local and sets cursor", async () => {
    const local = await doc(walletPayload("Local"));
    const remote = await doc(walletPayload("Remote"));
    const deps = createMemoryDeps({ local, remote, cursor: "old" });

    const result = await resolveConflict("remote", deps);

    expect(result).toEqual({ status: "pulled", contentHash: remote.content_hash });
    expect(await deps.getLocalDocument()).toEqual(remote);
    expect(deps.cursorRef.value).toBe(remote.content_hash);
  });
});
