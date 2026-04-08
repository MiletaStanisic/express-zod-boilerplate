import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { getOpenApiDocument, getSwaggerHtml } from "./docs/openapi.js";
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

  app.get("/openapi.json", (_req, res) => {
    res.json(getOpenApiDocument(env.PORT));
  });
  app.get("/docs", (_req, res) => {
    res.type("html").send(getSwaggerHtml());
  });

  app.use(healthRouter);
  app.use(incidentsRouter);
  app.use(alertsRouter);
  app.use(maintenanceWindowsRouter);
  app.use(teamsRouter);
  app.use(dashboardRouter);

  app.use(errorHandler);

  return app;
}
