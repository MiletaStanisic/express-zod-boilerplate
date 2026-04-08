import { Router } from "express";
import { dashboardService } from "../services/dashboard.service.js";

export const dashboardRouter = Router();

dashboardRouter.get("/dashboard/kpis", (_req, res) => {
  res.json(dashboardService.kpis());
});
