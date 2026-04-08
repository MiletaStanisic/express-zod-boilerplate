import type { Alert, Incident, MaintenanceWindow, Shift, Store, Team } from "../schemas/index.js";

const T = (offsetMs: number): string =>
  new Date(Date.now() - offsetMs).toISOString();

const h = 3_600_000;
const d = 86_400_000;

const teams: Team[] = [
  { id: "team-1", name: "Platform SRE", description: "Platform reliability engineering", createdAt: T(30 * d) },
  { id: "team-2", name: "Backend Core", description: "Core backend services", createdAt: T(30 * d) },
  { id: "team-3", name: "Frontend", description: "Frontend engineering", createdAt: T(25 * d) }
];

const incidents: Incident[] = [
  {
    id: "inc-1",
    title: "Database latency spike",
    description: "P95 latency above 500ms on primary cluster",
    severity: "critical",
    status: "investigating",
    teamId: "team-1",
    createdAt: T(4 * h),
    updatedAt: T(2 * h),
    acknowledgedAt: T(2 * h),
    resolvedAt: null
  },
  {
    id: "inc-2",
    title: "API rate limit exceeded",
    description: "External partner API returning 429s",
    severity: "medium",
    status: "open",
    teamId: "team-2",
    createdAt: T(6 * h),
    updatedAt: T(6 * h),
    acknowledgedAt: null,
    resolvedAt: null
  },
  {
    id: "inc-3",
    title: "SSL certificate expiry",
    description: "Certificate expires in 3 days",
    severity: "high",
    status: "resolved",
    teamId: "team-1",
    createdAt: T(2 * d),
    updatedAt: T(d),
    acknowledgedAt: T(2 * d - 30 * 60_000),
    resolvedAt: T(d)
  },
  {
    id: "inc-4",
    title: "Memory leak in worker process",
    description: "Worker heap reaching 90% after 6h of operation",
    severity: "low",
    status: "closed",
    teamId: "team-2",
    createdAt: T(5 * d),
    updatedAt: T(3 * d),
    acknowledgedAt: T(5 * d - h),
    resolvedAt: T(3 * d + h)
  }
];

const alerts: Alert[] = [
  {
    id: "alert-1",
    title: "High CPU usage",
    message: "CPU usage > 95% for 5 minutes on prod-db-01",
    severity: "critical",
    status: "firing",
    incidentId: "inc-1",
    createdAt: T(4 * h + 5 * 60_000),
    updatedAt: T(4 * h + 5 * 60_000)
  },
  {
    id: "alert-2",
    title: "Rate limit warnings",
    message: "429 error rate > 10% for external API calls",
    severity: "medium",
    status: "firing",
    incidentId: "inc-2",
    createdAt: T(6 * h + 10 * 60_000),
    updatedAt: T(6 * h + 10 * 60_000)
  },
  {
    id: "alert-3",
    title: "Disk space low",
    message: "Disk usage at 88% on prod-storage-01",
    severity: "high",
    status: "resolved",
    incidentId: null,
    createdAt: T(d + 2 * h),
    updatedAt: T(d)
  },
  {
    id: "alert-4",
    title: "Deployment health check failed",
    message: "Health endpoint returned 503 during canary deploy",
    severity: "high",
    status: "silenced",
    incidentId: null,
    createdAt: T(3 * h),
    updatedAt: T(2 * h)
  }
];

const maintenanceWindows: MaintenanceWindow[] = [
  {
    id: "mw-1",
    title: "Database index rebuild",
    description: "Scheduled index rebuild on analytics cluster",
    teamId: "team-1",
    startsAt: new Date(Date.now() + 2 * d).toISOString(),
    endsAt: new Date(Date.now() + 2 * d + 2 * h).toISOString(),
    status: "scheduled",
    createdAt: T(d),
    updatedAt: T(d)
  },
  {
    id: "mw-2",
    title: "Node upgrades",
    description: "Rolling node OS upgrade in prod cluster",
    teamId: "team-2",
    startsAt: T(4 * h),
    endsAt: T(2 * h),
    status: "active",
    createdAt: T(2 * d),
    updatedAt: T(4 * h)
  }
];

const shifts: Shift[] = [
  {
    id: "shift-1",
    teamId: "team-1",
    memberId: "user-101",
    role: "on-call-primary",
    startsAt: T(8 * h),
    endsAt: new Date(Date.now() + 16 * h).toISOString(),
    createdAt: T(2 * d)
  },
  {
    id: "shift-2",
    teamId: "team-1",
    memberId: "user-102",
    role: "on-call-secondary",
    startsAt: T(8 * h),
    endsAt: new Date(Date.now() + 16 * h).toISOString(),
    createdAt: T(2 * d)
  },
  {
    id: "shift-3",
    teamId: "team-2",
    memberId: "user-201",
    role: "on-call-primary",
    startsAt: T(4 * h),
    endsAt: new Date(Date.now() + 20 * h).toISOString(),
    createdAt: T(2 * d)
  }
];

function buildStore(): Store {
  return {
    incidents: [...incidents],
    alerts: [...alerts],
    maintenanceWindows: [...maintenanceWindows],
    teams: [...teams],
    shifts: [...shifts]
  };
}

export const store: Store = buildStore();

export function resetStore(): void {
  const fresh = buildStore();
  store.incidents = fresh.incidents;
  store.alerts = fresh.alerts;
  store.maintenanceWindows = fresh.maintenanceWindows;
  store.teams = fresh.teams;
  store.shifts = fresh.shifts;
}
