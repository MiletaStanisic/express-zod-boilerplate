import { Router } from "express";
import { Errors } from "../middleware/errors.js";
import {
  createMaintenanceWindowSchema,
  listMaintenanceWindowsQuerySchema
} from "../schemas/maintenanceWindow.js";
import { maintenanceWindowService } from "../services/maintenanceWindow.service.js";

export const maintenanceWindowsRouter = Router();

maintenanceWindowsRouter.get("/maintenance-windows", (req, res, next) => {
  const parsed = listMaintenanceWindowsQuerySchema.safeParse(req.query);
  if (!parsed.success) return void next(Errors.validationError(parsed.error.flatten()));

  res.json(maintenanceWindowService.list(parsed.data));
});

maintenanceWindowsRouter.post("/maintenance-windows", (req, res, next) => {
  const parsed = createMaintenanceWindowSchema.safeParse(req.body);
  if (!parsed.success) return void next(Errors.validationError(parsed.error.flatten()));

  res.status(201).json(maintenanceWindowService.create(parsed.data));
});
