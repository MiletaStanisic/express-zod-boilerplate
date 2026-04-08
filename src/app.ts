import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler } from "./middleware/errorHandler.js";
import { alertsRouter } from "./routes/alerts.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { healthRouter } from "./routes/health.js";
import { incidentsRouter } from "./routes/incidents.js";
import { maintenanceWindowsRouter } from "./routes/maintenanceWindows.js";
import { teamsRouter } from "./routes/teams.js";

export function buildApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.use(healthRouter);
  app.use(incidentsRouter);
  app.use(alertsRouter);
  app.use(maintenanceWindowsRouter);
  app.use(teamsRouter);
  app.use(dashboardRouter);

  app.use(errorHandler);

  return app;
}
