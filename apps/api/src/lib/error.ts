import { type ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { ERROR_CODES } from "./error-codes";

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export class AppError extends HTTPException {
  code: string;
  details?: Record<string, string[]>;

  constructor(
    status: 400 | 401 | 403 | 404 | 409 | 500,
    code: string,
    message: string,
    details?: Record<string, string[]>
  ) {
    super(status, { message });
    this.code = code;
    this.details = details;
  }

  toJSON(): ErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

export const onError: ErrorHandler = async (error, context) => {
  const wideEvent = context.get("wideEvent");

  if (error instanceof AppError) {
    if (wideEvent) {
      wideEvent.outcome = "error";
      wideEvent.error = {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
      };
    }

    return context.json(error.toJSON() as ErrorResponse, error.status);
  }

  if (error instanceof HTTPException) {
    if (wideEvent) {
      wideEvent.outcome = "error";
      wideEvent.error = {
        type: error.constructor.name,
        message: error.message,
      };
    }

    return error.getResponse();
  }

  if (wideEvent) {
    wideEvent.outcome = "error";
    wideEvent.error = {
      type: error instanceof Error ? error.constructor.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }

  return context.json(
    new AppError(500, ERROR_CODES.INTERNAL.SERVER_ERROR, "Internal server error").toJSON(),
    500
  );
};
