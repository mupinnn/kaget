import { createMiddleware } from "hono/factory";
import { nanoid } from "nanoid";
import { logger } from "../lib/logger";

export function createLoggerMiddleware() {
  return createMiddleware(async (c, next) => {
    const requestId = nanoid();
    const startTime = Date.now();

    const wideEvent: Record<string, unknown> = {
      request_id: requestId,
      method: c.req.method,
      path: c.req.path,
      timestamp: new Date().toISOString(),
      outcome: "success",
    };

    c.set("requestId", requestId);
    c.set("wideEvent", wideEvent);

    try {
      await next();
      wideEvent.status_code = c.res.status;
    } catch (error) {
      wideEvent.status_code = 500;
      throw error;
    } finally {
      wideEvent.duration_ms = Date.now() - startTime;
      logger.info(wideEvent);
    }
  });
}
