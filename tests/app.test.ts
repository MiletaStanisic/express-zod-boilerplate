import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";

const app = buildApp();

describe("Express boilerplate", () => {
  it("returns health payload", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: "ok" });
  });

  it("rejects invalid task payload", async () => {
    const response = await request(app).post("/tasks").send({ title: "x" });
    expect(response.status).toBe(400);
  });

  it("creates task with valid payload", async () => {
    const response = await request(app).post("/tasks").send({ title: "Ship backend walkthrough" });
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      title: "Ship backend walkthrough",
      done: false
    });
  });
});
