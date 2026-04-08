import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "../config/env.js";
import { InitOpsSchema1744139700000 } from "./migrations/1744139700000-init-ops-schema.js";

export const appDataSource = new DataSource({
  type: "postgres",
  url: env.DATABASE_URL,
  ssl: false,
  synchronize: false,
  migrationsRun: false,
  logging: false,
  entities: [],
  migrations: [InitOpsSchema1744139700000]
});
