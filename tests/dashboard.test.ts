import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Alert } from "../src/schemas/alert.js";
import type { Incident } from "../src/schemas/incident.js";
import { dashboardService } from "../src/services/dashboard.service.js";
import { store } from "../src/store/index.js";
import { resetStore } from "../src/store/index.js";

const now = new Date();

function iso(offsetMs: number): string {
  return new Date(now.getTime() - offsetMs).toISOString();
}

const h = 3_600_000;
const d = 86_400_000;

describe("dashboardService.kpis() — MTTA", () => {
  beforeEach(() => {
    store.incidents = [];
    store.alerts = [];
  });
  afterEach(() => resetStore());

  it("returns null MTTA when no incidents are acknowledged", () => {
    store.incidents = [
      makeIncident("i1", { acknowledgedAt: null, resolvedAt: null })
    ];
    const kpis = dashboardService.kpis();
    expect(kpis.mttaMinutes).toBeNull();
  });

  it("calculates MTTA correctly for a single incident (30 min ack)", () => {
    store.incidents = [
      makeIncident("i1", {
        createdAt: iso(30 * 60_000),
        acknowledgedAt: iso(0),
        resolvedAt: null
      })
    ];
    const kpis = dashboardService.kpis();
    expect(kpis.mttaMinutes).toBe(30);
  });

  it("averages MTTA across multiple incidents", () => {
    store.incidents = [
      makeIncident("i1", { createdAt: iso(60 * 60_000), acknowledgedAt: iso(0), resolvedAt: null }),
      makeIncident("i2", { createdAt: iso(30 * 60_000), acknowledgedAt: iso(0), resolvedAt: null })
    ];
    // MTTA = (60 + 30) / 2 = 45 minutes
    const kpis = dashboardService.kpis();
    expect(kpis.mttaMinutes).toBe(45);
  });
});

describe("dashboardService.kpis() — MTTR", () => {
  beforeEach(() => {
    store.incidents = [];
    store.alerts = [];
  });
  afterEach(() => resetStore());

  it("returns null MTTR when no incidents are resolved", () => {
    store.incidents = [
      makeIncident("i1", { acknowledgedAt: null, resolvedAt: null })
    ];
    expect(dashboardService.kpis().mttrMinutes).toBeNull();
  });

  it("calculates MTTR for a single resolved incident (2h)", () => {
    store.incidents = [
      makeIncident("i1", {
        createdAt: iso(2 * h),
        acknowledgedAt: iso(h),
        resolvedAt: iso(0)
      })
    ];
    const kpis = dashboardService.kpis();
    expect(kpis.mttrMinutes).toBe(120);
  });

  it("averages MTTR across multiple resolved incidents", () => {
    store.incidents = [
      makeIncident("i1", { createdAt: iso(4 * h), acknowledgedAt: iso(2 * h), resolvedAt: iso(0) }),
      makeIncident("i2", { createdAt: iso(2 * h), acknowledgedAt: iso(h), resolvedAt: iso(0) })
    ];
    // MTTR = (240 + 120) / 2 = 180 minutes
    expect(dashboardService.kpis().mttrMinutes).toBe(180);
  });
});

describe("dashboardService.kpis() — open critical incidents", () => {
  beforeEach(() => {
    store.incidents = [];
    store.alerts = [];
  });
  afterEach(() => resetStore());

  it("counts open + investigating critical incidents", () => {
    store.incidents = [
      makeIncident("i1", { severity: "critical", status: "open" }),
      makeIncident("i2", { severity: "critical", status: "investigating" }),
      makeIncident("i3", { severity: "critical", status: "resolved" }),
      makeIncident("i4", { severity: "high", status: "open" })
    ];
    expect(dashboardService.kpis().openCriticalIncidents).toBe(2);
  });

  it("returns 0 when no critical open incidents", () => {
    store.incidents = [
      makeIncident("i1", { severity: "high", status: "open" }),
      makeIncident("i2", { severity: "critical", status: "closed" })
    ];
    expect(dashboardService.kpis().openCriticalIncidents).toBe(0);
  });
});

describe("dashboardService.kpis() — alert volume", () => {
  beforeEach(() => {
    store.incidents = [];
    store.alerts = [];
  });
  afterEach(() => resetStore());

  it("counts alerts within each time window", () => {
    store.alerts = [
      makeAlert("a1", { createdAt: iso(1 * h) }),        // within 24h, 7d, 30d
      makeAlert("a2", { createdAt: iso(3 * d) }),         // within 7d, 30d
      makeAlert("a3", { createdAt: iso(15 * d) }),        // within 30d only
      makeAlert("a4", { createdAt: iso(35 * d) })         // outside all windows
    ];

    const { alertVolume } = dashboardService.kpis();
    expect(alertVolume.last24h).toBe(1);
    expect(alertVolume.last7d).toBe(2);
    expect(alertVolume.last30d).toBe(3);
  });

  it("returns zeros when no alerts exist", () => {
    store.alerts = [];
    const { alertVolume } = dashboardService.kpis();
    expect(alertVolume.last24h).toBe(0);
    expect(alertVolume.last7d).toBe(0);
    expect(alertVolume.last30d).toBe(0);
  });
});

// ─── helpers ────────────────────────────────────────────────────────────────

function makeIncident(
  id: string,
  overrides: Partial<Incident> = {}
): Incident {
  return {
    id,
    title: "Test incident",
    description: "Test",
    severity: "high",
    status: "open",
    teamId: "team-1",
    createdAt: iso(h),
    updatedAt: iso(h),
    acknowledgedAt: null,
    resolvedAt: null,
    ...overrides
  };
}

function makeAlert(id: string, overrides: Partial<Alert> = {}): Alert {
  return {
    id,
    title: "Test alert",
    message: "Test",
    severity: "medium",
    status: "firing",
    incidentId: null,
    createdAt: iso(h),
    updatedAt: iso(h),
    ...overrides
  };
}
