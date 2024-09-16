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

export const api = wretch()
  .addon(wretchQueryStringAddon)
  .resolve(r => {
    return r
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
      .json();
  });
