import type { Alert } from "./alert.js";
import type { Incident } from "./incident.js";
import type { MaintenanceWindow } from "./maintenanceWindow.js";
import type { Shift, Team } from "./team.js";

export type { Alert, AlertStatus } from "./alert.js";
export type { Incident, IncidentStatus } from "./incident.js";
export type { MaintenanceStatus, MaintenanceWindow } from "./maintenanceWindow.js";
export type { Severity } from "./common.js";
export type { Shift, Team } from "./team.js";

export interface Store {
  incidents: Incident[];
  alerts: Alert[];
  maintenanceWindows: MaintenanceWindow[];
  teams: Team[];
  shifts: Shift[];
}
