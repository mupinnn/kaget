export class SomethingWentWrongError extends Error {
  constructor(message = "Something went wrong. Please contact https://github.com/mupinnn") {
    super(message);
    this.name = "SomethingWentWrongError";
  }
}

export class HttpResponseError extends Error {
  status?: number;

  constructor(message?: string) {
    super(message);
  }
}

export class BadRequestError extends HttpResponseError {
  constructor(message = "Bad Request") {
    super(message);
    this.name = "BadRequestError";
    this.status = 400;
  }
}

export class NotFoundError extends HttpResponseError {
  constructor(message = "Not Found") {
    super(message);
    this.status = 404;
    this.name = "NotFoundError";
  }
}

export class ConflictError extends HttpResponseError {
  constructor(message = "Conflict") {
    super(message);
    this.status = 409;
    this.name = "ConflictError";
  }
}

export class UnprocessableEntityError extends HttpResponseError {
  constructor(message = "Unprocessable Entity") {
    super(message);
    this.status = 422;
    this.name = "UnprocessableEntityError";
  }
}

export class InternalServerError extends HttpResponseError {
  constructor(message = "Internal Server Error. Please contact https://github.com/mupinnn") {
    super(message);
    this.status = 500;
    this.name = "InternalServerError";
  }
}

export class FetchError extends HttpResponseError {
  constructor(message?: string) {
    super(message);
    this.name = "FetchError";
  }
}
