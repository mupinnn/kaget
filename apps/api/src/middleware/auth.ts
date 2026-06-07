import { createMiddleware } from "hono/factory";
import type { Auth } from "../lib/auth";
import { AppError } from "../lib/error";
import { ERROR_CODES } from "../lib/error-codes";

export function createAuthMiddleware(auth: Auth) {
  return createMiddleware(async (c, next) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      c.set("user", null);
      c.set("session", null);
      throw new AppError(401, ERROR_CODES.AUTH.UNAUTHORIZED, "Unauthorized");
    }

    c.set("user", session.user);
    c.set("session", session.session);
    await next();
  });
}
