export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  notFound: (resource: string, id: string) =>
    new AppError("NOT_FOUND", 404, `${resource} '${id}' not found`),

  invalidTransition: (from: string, to: string) =>
    new AppError(
      "INVALID_TRANSITION",
      422,
      `Cannot transition from '${from}' to '${to}'`
    ),

  validationError: (details: unknown) =>
    new AppError("VALIDATION_ERROR", 400, "Validation failed", details),

  internal: (message = "Unexpected error") =>
    new AppError("INTERNAL_ERROR", 500, message)
} as const;
