import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as z from "zod";

const app = new Hono();

export const route = app.get(
  "/api/hello",
  zValidator(
    "query",
    z.object({
      name: z.string(),
    })
  ),
  c => {
    const { name } = c.req.valid("query");
    return c.json({
      message: `Hello, ${name}`,
    });
  }
);

export type AppType = typeof route;

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  info => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
