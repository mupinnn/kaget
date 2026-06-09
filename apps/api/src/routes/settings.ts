import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import type { Database } from "../db/client";
import { settings } from "../db/schema";
import { type Auth, getSafeSession } from "../lib/auth";
import { AppError } from "../lib/error";
import { ERROR_CODES } from "../lib/error-codes";
import { currencyCodeBodySchema, toSettingsResponse } from "../lib/settings";
import { validator } from "../lib/validator";

export function createSettingsRoutes(db: Database, _auth: Auth) {
  return new Hono()
    .get("/", async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");

      const row = await db.query.settings.findFirst({
        where: eq(settings.userId, user.id),
      });

      if (!row) {
        throw new AppError(404, ERROR_CODES.SETTINGS.NOT_FOUND, "Settings not found");
      }

      wideEvent.settings = { currency_code: row.currencyCode };

      return c.json({ data: toSettingsResponse(row) });
    })

    .post("/", validator("json", currencyCodeBodySchema), async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const { currencyCode } = c.req.valid("json");

      const existing = await db.query.settings.findFirst({
        where: eq(settings.userId, user.id),
      });

      if (existing) {
        throw new AppError(409, ERROR_CODES.SETTINGS.CONFLICT, "Settings already exist");
      }

      const now = new Date();
      const settingsId = nanoid();

      const [row] = await db
        .insert(settings)
        .values({
          id: settingsId,
          userId: user.id,
          currencyCode,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      wideEvent.settings = { created: true, currency_code: currencyCode };

      return c.json({ data: toSettingsResponse(row) }, 201);
    })

    .patch("/", validator("json", currencyCodeBodySchema), async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const { currencyCode } = c.req.valid("json");

      const [row] = await db
        .update(settings)
        .set({
          currencyCode,
          updatedAt: new Date(),
        })
        .where(eq(settings.userId, user.id))
        .returning();

      if (!row) {
        throw new AppError(404, ERROR_CODES.SETTINGS.NOT_FOUND, "Settings not found");
      }

      wideEvent.settings = { updated: true, currency_code: currencyCode };

      return c.json({ data: toSettingsResponse(row) });
    });
}
