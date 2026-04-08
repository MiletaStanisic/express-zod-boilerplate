import { z } from "zod";
import { paginationSchema, severitySchema } from "./common.js";

export const alertStatusSchema = z.enum(["firing", "resolved", "silenced"]);

export type AlertStatus = z.infer<typeof alertStatusSchema>;

export const alertSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  severity: severitySchema,
  status: alertStatusSchema,
  incidentId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Alert = z.infer<typeof alertSchema>;

export const createAlertSchema = z.object({
  title: z.string().min(3).max(200),
  message: z.string().min(1).max(2000),
  severity: severitySchema,
  incidentId: z.string().optional()
});

export const listAlertsQuerySchema = paginationSchema.extend({
  status: alertStatusSchema.optional(),
  severity: severitySchema.optional(),
  incidentId: z.string().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "severity"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc")
});
