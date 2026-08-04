import type { Auth } from "../auth";
import { AppError } from "../error";
import { ERROR_CODES } from "../error-codes";
import type { GoogleAccessTokenGetter } from "./types";

export function createGoogleAccessTokenGetter(auth: Auth): GoogleAccessTokenGetter {
  return async headers => {
    try {
      const result = await auth.api.getAccessToken({
        body: { providerId: "google" },
        headers,
      });

      if (!result?.accessToken) {
        throw new AppError(
          401,
          ERROR_CODES.DRIVE.GOOGLE_AUTH_REQUIRED,
          "Google Drive authorization required"
        );
      }

      return result.accessToken;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        401,
        ERROR_CODES.DRIVE.GOOGLE_AUTH_REQUIRED,
        "Google Drive authorization required"
      );
    }
  };
}
