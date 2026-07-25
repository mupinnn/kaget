import { Hono } from "hono";
import type { Auth } from "../lib/auth";
import { AppError } from "../lib/error";
import { ERROR_CODES } from "../lib/error-codes";

export function createMeRoutes(auth: Auth) {
  return new Hono().get("/", async c => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      throw new AppError(401, ERROR_CODES.AUTH.UNAUTHORIZED, "Unauthorized");
    }

    return c.json({ user: session.user });
  });
}
