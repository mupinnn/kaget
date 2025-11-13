import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";
import { P } from "ts-pattern";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// @see https://github.com/gvergnaud/ts-pattern/pull/45#issuecomment-955677581
export function matchZodSchema<S extends z.ZodTypeAny>(schema: S) {
  return P.when((obj: unknown): obj is z.infer<S> => schema.safeParse(obj).success);
}
