import { Router } from "express";
import { Errors } from "../middleware/errors.js";
import { createAlertSchema, listAlertsQuerySchema } from "../schemas/alert.js";
import { alertService } from "../services/alert.service.js";

export const alertsRouter = Router();

alertsRouter.get("/alerts", (req, res, next) => {
  const parsed = listAlertsQuerySchema.safeParse(req.query);
  if (!parsed.success) return void next(Errors.validationError(parsed.error.flatten()));

  res.json(alertService.list(parsed.data));
});

alertsRouter.post("/alerts", (req, res, next) => {
  const parsed = createAlertSchema.safeParse(req.body);
  if (!parsed.success) return void next(Errors.validationError(parsed.error.flatten()));

  try {
    res.status(201).json(alertService.create(parsed.data));
  } catch (err) {
    next(err);
  }
});
