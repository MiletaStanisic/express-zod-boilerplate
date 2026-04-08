import { Router } from "express";
import { teamService } from "../services/team.service.js";

export const teamsRouter = Router();

teamsRouter.get("/teams/workload", (_req, res) => {
  res.json({ data: teamService.workload() });
});
