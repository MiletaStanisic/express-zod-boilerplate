import type { ErrorRequestHandler } from "express";
import { AppError } from "./errors.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      ...(err.details !== undefined && { details: err.details })
    });
    return;
  }

  console.error("[unhandled]", err);
  res.status(500).json({ error: "INTERNAL_ERROR", message: "Unexpected error" });
};
