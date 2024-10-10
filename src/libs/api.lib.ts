import wretch from "wretch";
import wretchQueryStringAddon from "wretch/addons/queryString";
import {
  BadRequestError,
  NotFoundError,
  FetchError,
  ConflictError,
  InternalServerError,
  UnprocessableEntityError,
} from "@/utils/error.util";
import { env } from "@env";

export const api = wretch(`${env.VITE_API_URL}`)
  .addon(wretchQueryStringAddon)
  .resolve(async r => {
    return await r
      .badRequest(() => {
        throw new BadRequestError();
      })
      .notFound(() => {
        throw new NotFoundError();
      })
      .error(409, () => {
        throw new ConflictError();
      })
      .error(422, () => {
        throw new UnprocessableEntityError();
      })
      .internalError(() => {
        throw new InternalServerError();
      })
      .fetchError(() => {
        throw new FetchError();
      })
      .json()
      .catch(() => {
        throw new InternalServerError();
      });
  });
