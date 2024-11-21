import wretch from "wretch";
import wretchQueryStringAddon from "wretch/addons/queryString";
import {
  BadRequestError,
  NotFoundError,
  FetchError,
  ConflictError,
  InternalServerError,
  UnprocessableEntityError,
  HttpResponseError,
  SomethingWentWrongError,
} from "@/utils/error.util";
import { env } from "@env";
import { BaseAPIResponseSchema } from "@/schemas/api.schema";

export const api = wretch(`${env.VITE_API_URL}`)
  .addon(wretchQueryStringAddon)
  .errorType("json")
  .resolve(async r => {
    return await r
      .badRequest(error => {
        const parsedError = BaseAPIResponseSchema.parse(error.json);
        throw new BadRequestError(parsedError.message);
      })
      .notFound(error => {
        const parsedError = BaseAPIResponseSchema.parse(error.json);
        throw new NotFoundError(parsedError.message);
      })
      .error(409, error => {
        const parsedError = BaseAPIResponseSchema.parse(error.json);
        throw new ConflictError(parsedError.message);
      })
      .error(422, error => {
        const parsedError = BaseAPIResponseSchema.parse(error.json);
        throw new UnprocessableEntityError(parsedError.message);
      })
      .internalError(error => {
        const parsedError = BaseAPIResponseSchema.parse(error.json);
        throw new InternalServerError(parsedError.message);
      })
      .fetchError(error => {
        const parsedError = BaseAPIResponseSchema.parse(error.json);
        throw new FetchError(parsedError.message);
      })
      .json()
      .catch(error => {
        if (error instanceof HttpResponseError) throw error;
        throw new SomethingWentWrongError();
      });
  });
