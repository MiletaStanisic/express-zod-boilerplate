import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitOpsSchema1744139700000 implements MigrationInterface {
  name = "InitOpsSchema1744139700000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id text PRIMARY KEY,
        name text NOT NULL,
        description text NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id text PRIMARY KEY,
        title text NOT NULL,
        description text NOT NULL,
        severity text NOT NULL,
        status text NOT NULL,
        team_id text NOT NULL,
        acknowledged_at timestamptz NULL,
        resolved_at timestamptz NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT incidents_team_fk FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS incidents_status_idx ON incidents (status);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS incidents_severity_idx ON incidents (severity);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id text PRIMARY KEY,
        title text NOT NULL,
        message text NOT NULL,
        severity text NOT NULL,
        status text NOT NULL,
        incident_id text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT alerts_incident_fk FOREIGN KEY (incident_id) REFERENCES incidents (id) ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS alerts_status_idx ON alerts (status);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS alerts_severity_idx ON alerts (severity);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS maintenance_windows (
        id text PRIMARY KEY,
        title text NOT NULL,
        description text NOT NULL DEFAULT '',
        team_id text NOT NULL,
        starts_at timestamptz NOT NULL,
        ends_at timestamptz NOT NULL,
        status text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT maintenance_windows_team_fk FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS maintenance_windows_status_idx ON maintenance_windows (status);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS shifts (
        id text PRIMARY KEY,
        team_id text NOT NULL,
        member_id text NOT NULL,
        role text NOT NULL,
        starts_at timestamptz NOT NULL,
        ends_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT shifts_team_fk FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS shifts_team_idx ON shifts (team_id);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS shifts;");
    await queryRunner.query("DROP TABLE IF EXISTS maintenance_windows;");
    await queryRunner.query("DROP TABLE IF EXISTS alerts;");
    await queryRunner.query("DROP TABLE IF EXISTS incidents;");
    await queryRunner.query("DROP TABLE IF EXISTS teams;");
  }
}
