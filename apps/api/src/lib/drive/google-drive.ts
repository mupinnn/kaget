import { AppError } from "../error";
import { ERROR_CODES } from "../error-codes";
import {
  DRIVE_LEDGER_FILE_NAME,
  DRIVE_LEDGER_FOLDER_NAME,
  DRIVE_LEDGER_NEW_FILE_CONTENT,
} from "./constants";
import type { DriveClient, DriveFileMeta, DriveFilePayload } from "./types";

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";
const FOLDER_MIME = "application/vnd.google-apps.folder";
const META_FIELDS = "id,name,modifiedTime,trashed,mimeType";

type DriveApiFile = {
  id: string;
  name?: string;
  modifiedTime?: string;
  trashed?: boolean;
  mimeType?: string;
};

function toMeta(file: DriveApiFile): DriveFileMeta {
  return {
    fileId: file.id,
    name: file.name ?? DRIVE_LEDGER_FILE_NAME,
    modifiedTime: file.modifiedTime ?? null,
  };
}

async function driveFetch(accessToken: string, url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);

  const res = await fetch(url, { ...init, headers });

  if (res.status === 401) {
    throw new AppError(
      401,
      ERROR_CODES.DRIVE.GOOGLE_AUTH_REQUIRED,
      "Google Drive authorization required"
    );
  }

  return res;
}

async function readJson<T>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T;
  } catch {
    throw new AppError(502, ERROR_CODES.DRIVE.UPSTREAM_ERROR, "Invalid response from Google Drive");
  }
}

function assertOk(res: Response, message: string) {
  if (res.ok) {
    return;
  }

  if (res.status === 404) {
    throw new AppError(404, ERROR_CODES.DRIVE.FILE_NOT_FOUND, "Drive ledger file not found");
  }

  if (res.status === 403) {
    throw new AppError(
      401,
      ERROR_CODES.DRIVE.GOOGLE_AUTH_REQUIRED,
      "Google Drive authorization required"
    );
  }

  throw new AppError(502, ERROR_CODES.DRIVE.UPSTREAM_ERROR, message);
}

export function createGoogleDriveClient(): DriveClient {
  return {
    async getMeta(accessToken, fileId) {
      const res = await driveFetch(
        accessToken,
        `${DRIVE_API}/files/${encodeURIComponent(fileId)}?fields=${META_FIELDS}&supportsAllDrives=true`
      );

      if (res.status === 404) {
        return null;
      }

      assertOk(res, "Failed to fetch Drive file metadata");
      const file = await readJson<DriveApiFile>(res);
      if (file.trashed) {
        return null;
      }
      return toMeta(file);
    },

    async getContent(accessToken, fileId) {
      const metaRes = await driveFetch(
        accessToken,
        `${DRIVE_API}/files/${encodeURIComponent(fileId)}?fields=${META_FIELDS}&supportsAllDrives=true`
      );

      if (metaRes.status === 404) {
        return null;
      }

      assertOk(metaRes, "Failed to fetch Drive file metadata");
      const file = await readJson<DriveApiFile>(metaRes);
      if (file.trashed) {
        return null;
      }
      if (file.mimeType === FOLDER_MIME) {
        throw new AppError(
          502,
          ERROR_CODES.DRIVE.UPSTREAM_ERROR,
          "Drive file is a folder, not a ledger document"
        );
      }

      const mediaRes = await driveFetch(
        accessToken,
        `${DRIVE_API}/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`
      );

      if (mediaRes.status === 404) {
        return null;
      }

      assertOk(mediaRes, "Failed to download Drive file");

      let content: unknown;
      try {
        content = await mediaRes.json();
      } catch {
        throw new AppError(
          502,
          ERROR_CODES.DRIVE.INVALID_REMOTE_JSON,
          "Drive ledger file is not valid JSON"
        );
      }

      return {
        ...toMeta(file),
        content,
      } satisfies DriveFilePayload;
    },

    async updateContent(accessToken, fileId, content) {
      const body = JSON.stringify(content);
      const res = await driveFetch(
        accessToken,
        `${DRIVE_UPLOAD_API}/files/${encodeURIComponent(fileId)}?uploadType=media&fields=${META_FIELDS}&supportsAllDrives=true`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body,
        }
      );

      assertOk(res, "Failed to upload Drive ledger file");
      const file = await readJson<DriveApiFile>(res);
      return toMeta(file);
    },

    async createOrOpenDefault(accessToken) {
      const folderId = await findOrCreateFolder(accessToken);
      const existing = await findChildFile(accessToken, folderId, DRIVE_LEDGER_FILE_NAME);
      if (existing) {
        return toMeta(existing);
      }
      return createLedgerFile(accessToken, folderId);
    },
  };
}

async function findOrCreateFolder(accessToken: string) {
  const q = encodeURIComponent(
    `name = '${DRIVE_LEDGER_FOLDER_NAME}' and mimeType = '${FOLDER_MIME}' and trashed = false`
  );
  const listRes = await driveFetch(
    accessToken,
    `${DRIVE_API}/files?q=${q}&spaces=drive&fields=files(${META_FIELDS})&pageSize=1`
  );
  assertOk(listRes, "Failed to search for Drive folder");
  const list = await readJson<{ files?: DriveApiFile[] }>(listRes);
  const found = list.files?.[0];
  if (found) {
    return found.id;
  }

  const createRes = await driveFetch(accessToken, `${DRIVE_API}/files?fields=${META_FIELDS}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: DRIVE_LEDGER_FOLDER_NAME,
      mimeType: FOLDER_MIME,
    }),
  });
  assertOk(createRes, "Failed to create Drive folder");
  const folder = await readJson<DriveApiFile>(createRes);
  return folder.id;
}

async function findChildFile(accessToken: string, folderId: string, name: string) {
  const q = encodeURIComponent(
    `name = '${name}' and '${folderId}' in parents and trashed = false and mimeType != '${FOLDER_MIME}'`
  );
  const listRes = await driveFetch(
    accessToken,
    `${DRIVE_API}/files?q=${q}&spaces=drive&fields=files(${META_FIELDS})&pageSize=1`
  );
  assertOk(listRes, "Failed to search for Drive ledger file");
  const list = await readJson<{ files?: DriveApiFile[] }>(listRes);
  return list.files?.[0] ?? null;
}

async function createLedgerFile(accessToken: string, folderId: string) {
  const metadata = {
    name: DRIVE_LEDGER_FILE_NAME,
    parents: [folderId],
    mimeType: "application/json",
  };
  const boundary = `kaget_${Date.now().toString(36)}`;
  const body =
    `--${boundary}\r\n` +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    "Content-Type: application/json\r\n\r\n" +
    `${JSON.stringify(DRIVE_LEDGER_NEW_FILE_CONTENT)}\r\n` +
    `--${boundary}--`;

  const res = await driveFetch(
    accessToken,
    `${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=${META_FIELDS}`,
    {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    }
  );
  assertOk(res, "Failed to create Drive ledger file");
  return toMeta(await readJson<DriveApiFile>(res));
}
