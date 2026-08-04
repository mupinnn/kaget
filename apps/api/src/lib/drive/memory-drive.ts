import { nanoid } from "nanoid";
import { AppError } from "../error";
import { ERROR_CODES } from "../error-codes";
import {
  DRIVE_LEDGER_FILE_NAME,
  DRIVE_LEDGER_FOLDER_NAME,
  DRIVE_LEDGER_NEW_FILE_CONTENT,
} from "./constants";
import type { DriveClient, DriveFileMeta, DriveFilePayload } from "./types";

type MemoryFile = {
  id: string;
  name: string;
  mimeType: string;
  parents: string[];
  content: unknown;
  modifiedTime: string;
  trashed: boolean;
};

function nowIso() {
  return new Date().toISOString();
}

function toMeta(file: MemoryFile): DriveFileMeta {
  return {
    fileId: file.id,
    name: file.name,
    modifiedTime: file.modifiedTime,
  };
}

/**
 * In-memory Drive double for integration tests. No network.
 */
export function createMemoryDriveClient(): DriveClient & {
  /** Test helper: mark a file trashed / gone. */
  trash(fileId: string): void;
  /** Test helper: inspect stored opaque content. */
  peek(fileId: string): unknown | undefined;
} {
  const files = new Map<string, MemoryFile>();

  function requireFile(fileId: string) {
    const file = files.get(fileId);
    if (!file || file.trashed) {
      return null;
    }
    return file;
  }

  return {
    async getMeta(_accessToken, fileId) {
      const file = requireFile(fileId);
      return file ? toMeta(file) : null;
    },

    async getContent(_accessToken, fileId) {
      const file = requireFile(fileId);
      if (!file) {
        return null;
      }
      if (file.mimeType === "application/vnd.google-apps.folder") {
        throw new AppError(
          502,
          ERROR_CODES.DRIVE.UPSTREAM_ERROR,
          "Drive file is a folder, not a ledger document"
        );
      }
      return {
        ...toMeta(file),
        content: file.content,
      } satisfies DriveFilePayload;
    },

    async updateContent(_accessToken, fileId, content) {
      const file = requireFile(fileId);
      if (!file) {
        throw new AppError(404, ERROR_CODES.DRIVE.FILE_NOT_FOUND, "Drive ledger file not found");
      }
      file.content = content;
      file.modifiedTime = nowIso();
      return toMeta(file);
    },

    async createOrOpenDefault(_accessToken) {
      let folder = [...files.values()].find(
        f =>
          !f.trashed &&
          f.name === DRIVE_LEDGER_FOLDER_NAME &&
          f.mimeType === "application/vnd.google-apps.folder"
      );

      if (!folder) {
        folder = {
          id: nanoid(),
          name: DRIVE_LEDGER_FOLDER_NAME,
          mimeType: "application/vnd.google-apps.folder",
          parents: ["root"],
          content: null,
          modifiedTime: nowIso(),
          trashed: false,
        };
        files.set(folder.id, folder);
      }

      let ledger = [...files.values()].find(
        f =>
          !f.trashed &&
          f.name === DRIVE_LEDGER_FILE_NAME &&
          f.parents.includes(folder.id) &&
          f.mimeType !== "application/vnd.google-apps.folder"
      );

      if (!ledger) {
        ledger = {
          id: nanoid(),
          name: DRIVE_LEDGER_FILE_NAME,
          mimeType: "application/json",
          parents: [folder.id],
          content: { ...DRIVE_LEDGER_NEW_FILE_CONTENT },
          modifiedTime: nowIso(),
          trashed: false,
        };
        files.set(ledger.id, ledger);
      }

      return toMeta(ledger);
    },

    trash(fileId) {
      const file = files.get(fileId);
      if (file) {
        file.trashed = true;
      }
    },

    peek(fileId) {
      return files.get(fileId)?.content;
    },
  };
}
