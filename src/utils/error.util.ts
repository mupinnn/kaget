export class HttpResponseError extends Error {
  code?: number;

  constructor(message?: string) {
    super(message);
  }
}

export class BadRequestError extends HttpResponseError {
  constructor(message = "Bad Request") {
    super(message);
    this.name = "BadRequestError";
    this.code = 400;
  }
}

export class NotFoundError extends HttpResponseError {
  constructor(message = "Not Found") {
    super(message);
    this.code = 404;
    this.name = "NotFoundError";
  }
}

export class ConflictError extends HttpResponseError {
  constructor(message = "Conflict") {
    super(message);
    this.code = 409;
    this.name = "ConflictError";
  }
}

export class UnprocessableEntityError extends HttpResponseError {
  constructor(message = "Unprocessable Entity") {
    super(message);
    this.code = 422;
    this.name = "UnprocessableEntityError";
  }
}

export class InternalServerError extends HttpResponseError {
  constructor(message = "Interal Server Error") {
    super(message);
    this.code = 500;
    this.name = "InternalServerError";
  }
}

export class FetchError extends HttpResponseError {
  constructor(message?: string) {
    super(message);
    this.name = "FetchError";
  }
}
