import { zValidator } from "@hono/zod-validator";
import { type ValidationTargets } from "hono";
import * as z from "zod";
import { AppError } from "./error";
import { ERROR_CODES } from "./error-codes";

export const validator = <T extends z.ZodType, Target extends keyof ValidationTargets>(
  target: Target,
  schema: T
) => {
  return zValidator(target, schema, result => {
    if (!result.success) {
      const details: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join(".");
        if (!details[key]) {
          details[key] = [];
        }
        details[key].push(issue.message);
      }
      throw new AppError(400, ERROR_CODES.VALIDATION.INVALID_INPUT, "Validation failed", details);
    }
  });
};
