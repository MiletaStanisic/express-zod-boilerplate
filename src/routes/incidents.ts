import { Router } from "express";
import { Errors } from "../middleware/errors.js";
import {
  createIncidentSchema,
  listIncidentsQuerySchema,
  patchIncidentStatusSchema
} from "../schemas/incident.js";
import { incidentService } from "../services/incident.service.js";

export const incidentsRouter = Router();

incidentsRouter.get("/incidents", (req, res, next) => {
  const parsed = listIncidentsQuerySchema.safeParse(req.query);
  if (!parsed.success) return void next(Errors.validationError(parsed.error.flatten()));

  res.json(incidentService.list(parsed.data));
});

incidentsRouter.post("/incidents", (req, res, next) => {
  const parsed = createIncidentSchema.safeParse(req.body);
  if (!parsed.success) return void next(Errors.validationError(parsed.error.flatten()));

  res.status(201).json(incidentService.create(parsed.data));
});

incidentsRouter.patch("/incidents/:id/status", (req, res, next) => {
  const parsed = patchIncidentStatusSchema.safeParse(req.body);
  if (!parsed.success) return void next(Errors.validationError(parsed.error.flatten()));

  try {
    res.json(incidentService.transition(req.params.id, parsed.data.status));
  } catch (err) {
    next(err);
  }
});
