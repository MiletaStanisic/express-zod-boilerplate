import { randomUUID } from "node:crypto";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(3)
});

const tasks: Array<{ id: string; title: string; done: boolean }> = [
  {
    id: "seed-1",
    title: "Document deployment checklist",
    done: false
  }
];

export function buildApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "backend-express-zod-boilerplate"
    });
  });

  app.get("/tasks", (_req, res) => {
    res.json({ items: tasks });
  });

  app.post("/tasks", (req, res) => {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "INVALID_BODY",
        issues: parsed.error.flatten()
      });
    }

    const task = {
      id: randomUUID(),
      title: parsed.data.title,
      done: false
    };
    tasks.unshift(task);

    return res.status(201).json(task);
  });

  return app;
}
