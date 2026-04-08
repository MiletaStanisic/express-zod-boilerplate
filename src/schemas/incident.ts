import { z } from "zod";
import { paginationSchema, severitySchema } from "./common.js";

export const incidentStatusSchema = z.enum(["open", "investigating", "resolved", "closed"]);

export type IncidentStatus = z.infer<typeof incidentStatusSchema>;

export const incidentSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  severity: severitySchema,
  status: incidentStatusSchema,
  teamId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  acknowledgedAt: z.string().nullable(),
  resolvedAt: z.string().nullable()
});

export type Incident = z.infer<typeof incidentSchema>;

export const createIncidentSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(1).max(2000),
  severity: severitySchema,
  teamId: z.string().min(1)
});

export const patchIncidentStatusSchema = z.object({
  status: incidentStatusSchema
});

export const listIncidentsQuerySchema = paginationSchema.extend({
  status: incidentStatusSchema.optional(),
  severity: severitySchema.optional(),
  teamId: z.string().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "severity"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc")
});

export const VALID_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  open: ["investigating", "closed"],
  investigating: ["resolved", "closed"],
  resolved: ["closed"],
  closed: []
};
