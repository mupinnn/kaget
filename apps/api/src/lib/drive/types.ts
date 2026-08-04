export type DriveFileMeta = {
  fileId: string;
  name: string;
  modifiedTime: string | null;
};

export type DriveFilePayload = DriveFileMeta & {
  content: unknown;
};

/**
 * Port for Google Drive ledger I/O. Implementations must treat content as opaque JSON
 * (no KaGet ledger schema parsing).
 */
export type DriveClient = {
  /** Returns null when the file is missing or trashed. */
  getMeta(accessToken: string, fileId: string): Promise<DriveFileMeta | null>;
  /** Returns null when the file is missing or trashed. */
  getContent(accessToken: string, fileId: string): Promise<DriveFilePayload | null>;
  updateContent(accessToken: string, fileId: string, content: unknown): Promise<DriveFileMeta>;
  /** Create-or-open default path `KaGet/kaget-ledger.json`; new files get `{}`. */
  createOrOpenDefault(accessToken: string): Promise<DriveFileMeta>;
};

export type GoogleAccessTokenGetter = (headers: Headers) => Promise<string>;

export type DriveDeps = {
  drive: DriveClient;
  getGoogleAccessToken: GoogleAccessTokenGetter;
};

export function estimateJsonByteLength(content: unknown) {
  return new TextEncoder().encode(JSON.stringify(content)).byteLength;
}
