import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import type { Database } from "../db/client";
import { driveLedgerFile } from "../db/schema";
import type { Auth } from "../lib/auth";
import { getSafeSession } from "../lib/auth";
import type { DriveDeps, DriveFileMeta } from "../lib/drive/types";
import { estimateJsonByteLength } from "../lib/drive/types";
import { AppError } from "../lib/error";
import { ERROR_CODES } from "../lib/error-codes";
import { validator } from "../lib/validator";
import { putDriveLedgerSchema } from "./drive-ledger.schemas";

async function getPointer(db: Database, userId: string) {
  return db.query.driveLedgerFile.findFirst({
    where: eq(driveLedgerFile.userId, userId),
  });
}

async function upsertPointer(db: Database, userId: string, fileId: string) {
  const existing = await getPointer(db, userId);
  const now = new Date();

  if (existing) {
    await db
      .update(driveLedgerFile)
      .set({ fileId, updatedAt: now })
      .where(eq(driveLedgerFile.userId, userId));
    return;
  }

  await db.insert(driveLedgerFile).values({
    id: nanoid(),
    userId,
    fileId,
    createdAt: now,
    updatedAt: now,
  });
}

async function deletePointer(db: Database, userId: string) {
  await db.delete(driveLedgerFile).where(eq(driveLedgerFile.userId, userId));
}

function metaResponse(meta: DriveFileMeta) {
  return {
    fileId: meta.fileId,
    name: meta.name,
    modifiedTime: meta.modifiedTime,
  };
}

export function createDriveLedgerRoutes(db: Database, _auth: Auth, deps: DriveDeps) {
  const { drive, getGoogleAccessToken } = deps;

  return new Hono()
    .post("/ensure", async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const accessToken = await getGoogleAccessToken(c.req.raw.headers);

      const pointer = await getPointer(db, user.id);
      if (pointer) {
        const existing = await drive.getMeta(accessToken, pointer.fileId);
        if (existing) {
          wideEvent.drive = {
            action: "ensure",
            fileId: existing.fileId,
            rebound: false,
          };
          return c.json({ data: metaResponse(existing) });
        }
        await deletePointer(db, user.id);
      }

      const created = await drive.createOrOpenDefault(accessToken);
      await upsertPointer(db, user.id, created.fileId);

      wideEvent.drive = {
        action: "ensure",
        fileId: created.fileId,
        rebound: Boolean(pointer),
      };

      return c.json({ data: metaResponse(created) }, pointer ? 200 : 201);
    })

    .get("/", async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const accessToken = await getGoogleAccessToken(c.req.raw.headers);

      const pointer = await getPointer(db, user.id);
      if (!pointer) {
        throw new AppError(
          404,
          ERROR_CODES.DRIVE.FILE_NOT_BOUND,
          "No Drive ledger file bound for this user"
        );
      }

      const payload = await drive.getContent(accessToken, pointer.fileId);
      if (!payload) {
        throw new AppError(404, ERROR_CODES.DRIVE.FILE_NOT_FOUND, "Drive ledger file not found");
      }

      const byteLength = estimateJsonByteLength(payload.content);
      wideEvent.drive = {
        action: "download",
        fileId: payload.fileId,
        byteLength,
      };

      return c.json({
        data: {
          ...metaResponse(payload),
          content: payload.content,
        },
      });
    })

    .put("/", validator("json", putDriveLedgerSchema), async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const { content } = c.req.valid("json");
      const accessToken = await getGoogleAccessToken(c.req.raw.headers);

      const pointer = await getPointer(db, user.id);
      if (!pointer) {
        throw new AppError(
          404,
          ERROR_CODES.DRIVE.FILE_NOT_BOUND,
          "No Drive ledger file bound for this user"
        );
      }

      const meta = await drive.updateContent(accessToken, pointer.fileId, content);
      const byteLength = estimateJsonByteLength(content);

      wideEvent.drive = {
        action: "upload",
        fileId: meta.fileId,
        byteLength,
      };

      return c.json({ data: metaResponse(meta) });
    })

    .delete("/", async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");

      const pointer = await getPointer(db, user.id);
      if (!pointer) {
        wideEvent.drive = { action: "unbind", fileId: null, cleared: false };
        return c.json({ data: { cleared: false } });
      }

      await deletePointer(db, user.id);

      wideEvent.drive = {
        action: "unbind",
        fileId: pointer.fileId,
        cleared: true,
      };

      return c.json({ data: { cleared: true, fileId: pointer.fileId } });
    });
}
