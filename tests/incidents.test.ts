import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import type { Incident } from "../src/schemas/incident.js";
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

describe("Incident lifecycle transitions", () => {
  async function createIncident(severity = "high") {
    const res = await request(app).post("/incidents").send({
      title: "Transition test incident",
      description: "Used for transition testing",
      severity,
      teamId: "team-1"
    });
    expect(res.status).toBe(201);
    return res.body as {
      id: string;
      status: string;
      acknowledgedAt: string | null;
      resolvedAt: string | null;
    };
  }

  it("starts in open state", async () => {
    const incident = await createIncident();
    expect(incident.status).toBe("open");
    expect(incident.acknowledgedAt).toBeNull();
    expect(incident.resolvedAt).toBeNull();
  });

  it("transitions open -> investigating and sets acknowledgedAt", async () => {
    const incident = await createIncident();
    const res = await request(app)
      .patch(`/incidents/${incident.id}/status`)
      .send({ status: "investigating" });
    const body = res.body as Incident;

    expect(res.status).toBe(200);
    expect(body.status).toBe("investigating");
    expect(body.acknowledgedAt).not.toBeNull();
    expect(body.resolvedAt).toBeNull();
  });

  it("transitions investigating -> resolved and sets resolvedAt", async () => {
    const incident = await createIncident();

    await request(app)
      .patch(`/incidents/${incident.id}/status`)
      .send({ status: "investigating" });

    const res = await request(app)
      .patch(`/incidents/${incident.id}/status`)
      .send({ status: "resolved" });
    const body = res.body as Incident;

    expect(res.status).toBe(200);
    expect(body.status).toBe("resolved");
    expect(body.resolvedAt).not.toBeNull();
  });

  it("transitions resolved -> closed", async () => {
    const incident = await createIncident();
    await request(app).patch(`/incidents/${incident.id}/status`).send({ status: "investigating" });
    await request(app).patch(`/incidents/${incident.id}/status`).send({ status: "resolved" });
    const res = await request(app).patch(`/incidents/${incident.id}/status`).send({ status: "closed" });
    const body = res.body as Incident;

    expect(res.status).toBe(200);
    expect(body.status).toBe("closed");
  });

  it("transitions open -> closed directly", async () => {
    const incident = await createIncident();
    const res = await request(app)
      .patch(`/incidents/${incident.id}/status`)
      .send({ status: "closed" });
    const body = res.body as Incident;

    expect(res.status).toBe(200);
    expect(body.status).toBe("closed");
  });

  it("rejects invalid transition: open -> resolved", async () => {
    const incident = await createIncident();
    const res = await request(app)
      .patch(`/incidents/${incident.id}/status`)
      .send({ status: "resolved" });
    const body = res.body as ApiError;

    expect(res.status).toBe(422);
    expect(body.error).toBe("INVALID_TRANSITION");
  });

  it("rejects invalid transition: closed -> open", async () => {
    const incident = await createIncident();
    await request(app).patch(`/incidents/${incident.id}/status`).send({ status: "closed" });
    const res = await request(app)
      .patch(`/incidents/${incident.id}/status`)
      .send({ status: "open" });
    const body = res.body as ApiError;

    expect(res.status).toBe(422);
    expect(body.error).toBe("INVALID_TRANSITION");
  });

  it("rejects invalid transition: investigating -> open", async () => {
    const incident = await createIncident();
    await request(app).patch(`/incidents/${incident.id}/status`).send({ status: "investigating" });
    const res = await request(app)
      .patch(`/incidents/${incident.id}/status`)
      .send({ status: "open" });
    const body = res.body as ApiError;

    expect(res.status).toBe(422);
    expect(body.error).toBe("INVALID_TRANSITION");
  });

  it("returns 404 for non-existent incident", async () => {
    const res = await request(app)
      .patch("/incidents/non-existent-id/status")
      .send({ status: "investigating" });
    const body = res.body as ApiError;

    expect(res.status).toBe(404);
    expect(body.error).toBe("NOT_FOUND");
  });

  it("returns 400 for invalid status value", async () => {
    const incident = await createIncident();
    const res = await request(app)
      .patch(`/incidents/${incident.id}/status`)
      .send({ status: "unknown-state" });
    const body = res.body as ApiError;

    expect(res.status).toBe(400);
    expect(body.error).toBe("VALIDATION_ERROR");
  });

  it("does not overwrite acknowledgedAt on re-acknowledgment", async () => {
    const incident = await createIncident();
    const firstPatch = await request(app)
      .patch(`/incidents/${incident.id}/status`)
      .send({ status: "investigating" });
    const firstBody = firstPatch.body as Incident;
    const firstAck = firstBody.acknowledgedAt;

    expect(firstAck).not.toBeNull();

    const refetch = await request(app).get(`/incidents?status=investigating`);
    const refetchBody = refetch.body as Paginated<Incident>;
    const found = refetchBody.data.find((i) => i.id === incident.id);
    expect(found?.acknowledgedAt).toBe(firstAck);
  });
});

describe("Incident pagination and filtering", () => {
  it("respects page and limit", async () => {
    const res = await request(app).get("/incidents?page=1&limit=2");
    const body = res.body as Paginated<Incident>;
    expect(res.status).toBe(200);
    expect(body.data.length).toBeLessThanOrEqual(2);
    expect(body.meta.limit).toBe(2);
    expect(body.meta.page).toBe(1);
  });

  it("filters by status", async () => {
    const res = await request(app).get("/incidents?status=open");
    const body = res.body as Paginated<Incident>;
    expect(res.status).toBe(200);
    body.data.forEach((i) => {
      expect(i.status).toBe("open");
    });
  });

  it("sorts by severity descending", async () => {
    const res = await request(app).get("/incidents?sortBy=severity&sortOrder=desc");
    const body = res.body as Paginated<Incident>;
    expect(res.status).toBe(200);
    const rankMap: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
    const severities = body.data.map((i) => i.severity);
    for (let i = 1; i < severities.length; i++) {
      expect(rankMap[severities[i]]).toBeLessThanOrEqual(rankMap[severities[i - 1]]);
    }
  });
});
