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

export const api = wretch(`${env.VITE_API_URL}`)
  .addon(wretchQueryStringAddon)
  .errorType("json")
  .resolve(async r => {
    return await r
      .badRequest(error => {
        throw new BadRequestError();
      })
      .notFound(error => {
        throw new NotFoundError();
      })
      .error(409, error => {
        throw new ConflictError();
      })
      .error(422, error => {
        throw new UnprocessableEntityError();
      })
      .internalError(error => {
        throw new InternalServerError();
      })
      .fetchError(error => {
        throw new FetchError();
      })
      .json()
      .catch(error => {
        if (error instanceof HttpResponseError) throw error;
        throw new SomethingWentWrongError();
      });
  });
