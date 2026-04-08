import { z } from "zod";
import { paginationSchema } from "./common.js";

export const maintenanceStatusSchema = z.enum([
  "scheduled",
  "active",
  "completed",
  "cancelled"
]);

export type MaintenanceStatus = z.infer<typeof maintenanceStatusSchema>;

export const maintenanceWindowSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  teamId: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  status: maintenanceStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string()
});

export type MaintenanceWindow = z.infer<typeof maintenanceWindowSchema>;

export const createMaintenanceWindowSchema = z
  .object({
    title: z.string().min(3).max(200),
    description: z.string().max(2000).default(""),
    teamId: z.string().min(1),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime()
  })
  .refine((d) => new Date(d.endsAt) > new Date(d.startsAt), {
    message: "endsAt must be after startsAt",
    path: ["endsAt"]
  });

export const listMaintenanceWindowsQuerySchema = paginationSchema.extend({
  status: maintenanceStatusSchema.optional(),
  teamId: z.string().optional(),
  sortBy: z.enum(["createdAt", "startsAt", "endsAt"]).default("startsAt"),
  sortOrder: z.enum(["asc", "desc"]).default("asc")
});
