import type { Alert } from "../schemas/alert.js";
import type { Incident } from "../schemas/incident.js";
import { store } from "../store/index.js";

export interface KpiResult {
  mttaMinutes: number | null;
  mttrMinutes: number | null;
  openCriticalIncidents: number;
  alertVolume: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
}

function avgMinutes(incidents: Incident[], startField: "createdAt", endField: "acknowledgedAt" | "resolvedAt"): number | null {
  const completed = incidents.filter((i) => i[endField] !== null);
  if (completed.length === 0) return null;

  const sum = completed.reduce((acc, i) => {
    const end = new Date(i[endField] as string).getTime();
    const start = new Date(i[startField]).getTime();
    return acc + (end - start) / 60_000;
  }, 0);

  return Math.round(sum / completed.length);
}

function alertVolumeInWindow(alerts: Alert[], windowMs: number): number {
  const cutoff = Date.now() - windowMs;
  return alerts.filter((a) => new Date(a.createdAt).getTime() >= cutoff).length;
}

export const dashboardService = {
  kpis(): KpiResult {
    const { incidents, alerts } = store;

    return {
      mttaMinutes: avgMinutes(incidents, "createdAt", "acknowledgedAt"),
      mttrMinutes: avgMinutes(incidents, "createdAt", "resolvedAt"),
      openCriticalIncidents: incidents.filter(
        (i) =>
          i.severity === "critical" &&
          (i.status === "open" || i.status === "investigating")
      ).length,
      alertVolume: {
        last24h: alertVolumeInWindow(alerts, 86_400_000),
        last7d: alertVolumeInWindow(alerts, 7 * 86_400_000),
        last30d: alertVolumeInWindow(alerts, 30 * 86_400_000)
      }
    };
  }
};
