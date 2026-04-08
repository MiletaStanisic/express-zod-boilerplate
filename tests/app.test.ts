import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import type { Alert } from "../src/schemas/alert.js";
import type { Incident } from "../src/schemas/incident.js";
import type { MaintenanceWindow } from "../src/schemas/maintenanceWindow.js";
import { resetStore } from "../src/store/index.js";

interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

interface ApiError {
  error: string;
  message: string;
}

const app = buildApp();

afterEach(() => resetStore());

describe("GET /health", () => {
  it("returns ok status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok" });
  });
});

describe("GET /incidents", () => {
  it("returns paginated list", async () => {
    const res = await request(app).get("/incidents");
    const body = res.body as Paginated<Incident>;
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("meta");
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("filters by severity", async () => {
    const res = await request(app).get("/incidents?severity=critical");
    const body = res.body as Paginated<Incident>;
    expect(res.status).toBe(200);
    body.data.forEach((i) => {
      expect(i.severity).toBe("critical");
    });
  });

  it("rejects invalid query params", async () => {
    const res = await request(app).get("/incidents?severity=extreme");
    const body = res.body as ApiError;
    expect(res.status).toBe(400);
    expect(body.error).toBe("VALIDATION_ERROR");
  });
});

describe("POST /incidents", () => {
  it("creates an incident", async () => {
    const res = await request(app).post("/incidents").send({
      title: "Deploy failure on prod",
      description: "Deployment pipeline failed",
      severity: "high",
      teamId: "team-1"
    });
    const body = res.body as Incident;
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: "Deploy failure on prod",
      severity: "high",
      status: "open",
      acknowledgedAt: null,
      resolvedAt: null
    });
    expect(typeof body.id).toBe("string");
  });

  it("rejects invalid severity", async () => {
    const res = await request(app).post("/incidents").send({
      title: "Test incident",
      description: "desc",
      severity: "extreme",
      teamId: "team-1"
    });
    const body = res.body as ApiError;
    expect(res.status).toBe(400);
    expect(body.error).toBe("VALIDATION_ERROR");
  });

  it("rejects short title", async () => {
    const res = await request(app).post("/incidents").send({
      title: "x",
      description: "desc",
      severity: "low",
      teamId: "team-1"
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /alerts", () => {
  it("returns paginated list", async () => {
    const res = await request(app).get("/alerts");
    const body = res.body as Paginated<Alert>;
    expect(res.status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
  });
});

describe("POST /alerts", () => {
  it("creates an alert with valid body", async () => {
    const res = await request(app).post("/alerts").send({
      title: "CPU high",
      message: "CPU usage exceeded threshold",
      severity: "high"
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ status: "firing", severity: "high" });
  });

  it("rejects missing message", async () => {
    const res = await request(app).post("/alerts").send({
      title: "CPU high",
      severity: "high"
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /maintenance-windows", () => {
  it("returns paginated list", async () => {
    const res = await request(app).get("/maintenance-windows");
    const body = res.body as Paginated<MaintenanceWindow>;
    expect(res.status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
  });
});

describe("POST /maintenance-windows", () => {
  it("creates a maintenance window", async () => {
    const startsAt = new Date(Date.now() + 3_600_000).toISOString();
    const endsAt = new Date(Date.now() + 7_200_000).toISOString();
    const res = await request(app).post("/maintenance-windows").send({
      title: "Planned downtime",
      teamId: "team-1",
      startsAt,
      endsAt
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ status: "scheduled", teamId: "team-1" });
  });

  it("rejects when endsAt is before startsAt", async () => {
    const startsAt = new Date(Date.now() + 7_200_000).toISOString();
    const endsAt = new Date(Date.now() + 3_600_000).toISOString();
    const res = await request(app).post("/maintenance-windows").send({
      title: "Bad window",
      teamId: "team-1",
      startsAt,
      endsAt
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /teams/workload", () => {
  it("returns workload for all teams", async () => {
    const res = await request(app).get("/teams/workload");
    const body = res.body as { data: Array<{ team: unknown; openIncidents: number }> };
    expect(res.status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
    body.data.forEach((entry) => {
      expect(entry).toHaveProperty("team");
      expect(entry).toHaveProperty("openIncidents");
    });
  });
});

describe("GET /dashboard/kpis", () => {
  it("returns KPI shape", async () => {
    const res = await request(app).get("/dashboard/kpis");
    const body = res.body as {
      mttaMinutes: number | null;
      mttrMinutes: number | null;
      openCriticalIncidents: number;
      alertVolume: { last24h: number; last7d: number; last30d: number };
    };
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("mttaMinutes");
    expect(res.body).toHaveProperty("mttrMinutes");
    expect(res.body).toHaveProperty("openCriticalIncidents");
    expect(res.body).toHaveProperty("alertVolume");
    expect(body.alertVolume).toHaveProperty("last24h");
    expect(body.alertVolume).toHaveProperty("last7d");
    expect(body.alertVolume).toHaveProperty("last30d");
  });
});
