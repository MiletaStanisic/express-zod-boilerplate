# Operations Control Panel API

Production-style Express + TypeScript backend for ops teams: incidents, alerts, maintenance windows, team workload, and real-time KPI dashboards (MTTA / MTTR).

## Quick start

```bash
npm install
npm run skills:sync
npm run skills:verify
npm run dev          # http://localhost:4300
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot-reload on `PORT` (default `4300`) |
| `npm run build` | Compile to `dist/` |
| `npm run start` | Run compiled build |
| `npm run lint` | ESLint with TypeScript type-checking |
| `npm run test` | Vitest unit + integration tests |
| `npm run db:migrate` | Apply TypeORM migrations |
| `npm run db:migrate:revert` | Revert last TypeORM migration |
| `npm run db:migrate:status` | Show pending migration status |
| `npm run skills:sync` | Sync optional vendor skills from lockfile |
| `npm run skills:verify` | Verify required local backend skills (and optional vendor skills) |
| `npm run docker:up` | Start API + Postgres + Redis with Docker Compose |
| `npm run docker:down` | Stop Docker Compose services |
| `npm run docker:logs` | Tail Docker app logs |
| `npm run docker:validate` | Validate compose syntax |

## Architecture

```
src/
├── config/               # Env var validation (Zod)
├── middleware/           # Error handler + AppError
├── routes/               # Thin Express routers (health, incidents, alerts, …)
├── schemas/              # Zod schemas and TypeScript types per domain
├── services/             # Business logic (lifecycle, KPIs, workload)
└── store/                # In-memory store with seed data + resetStore()
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4300` | HTTP listen port |
| `NODE_ENV` | `development` | `development` \| `test` \| `production` |
| `DATABASE_URL` | `postgresql://app:app@localhost:5437/app?schema=public` | Local database URL |
| `REDIS_URL` | `redis://localhost:6383` | Local Redis URL |

## Persistence baseline

This repo now includes TypeORM baseline files:

- `src/db/data-source.ts`
- `src/db/migrations/1744139700000-init-ops-schema.ts`
- migration runners in `src/db/*.ts`

Current API still runs on in-memory services by default; TypeORM layer is prepared for incremental migration.

## API Reference

### `GET /health`

```http
GET /health HTTP/1.1
```

```json
{ "status": "ok", "service": "operations-control-panel" }
```

---

### Incidents

#### `GET /incidents`

Query params: `page`, `limit` (≤100), `status` (open|investigating|resolved|closed), `severity` (low|medium|high|critical), `teamId`, `sortBy` (createdAt|updatedAt|severity), `sortOrder` (asc|desc)

```http
GET /incidents?status=open&severity=critical&sortBy=severity&sortOrder=desc&page=1&limit=10
```

```json
{
  "data": [
    {
      "id": "inc-1",
      "title": "Database latency spike",
      "severity": "critical",
      "status": "investigating",
      "teamId": "team-1",
      "acknowledgedAt": "2026-04-08T10:00:00.000Z",
      "resolvedAt": null,
      "createdAt": "2026-04-08T08:00:00.000Z",
      "updatedAt": "2026-04-08T10:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```

#### `POST /incidents`

```http
POST /incidents
Content-Type: application/json

{
  "title": "API error rate spike",
  "description": "5xx rate above 5% for 10 minutes",
  "severity": "high",
  "teamId": "team-1"
}
```

Response `201`:
```json
{
  "id": "3f7a…",
  "title": "API error rate spike",
  "status": "open",
  "severity": "high",
  "acknowledgedAt": null,
  "resolvedAt": null
}
```

#### `PATCH /incidents/:id/status`

Valid transitions: `open → investigating | closed`, `investigating → resolved | closed`, `resolved → closed`

Acknowledging (`open → investigating`) auto-stamps `acknowledgedAt`.  
Resolving (`investigating → resolved`) auto-stamps `resolvedAt`.

```http
PATCH /incidents/3f7a.../status
Content-Type: application/json

{ "status": "investigating" }
```

Response `200` — updated incident object.  
Response `422` `INVALID_TRANSITION` — when transition is not allowed.  
Response `404` `NOT_FOUND` — unknown incident id.

## Docker local dev

```bash
cp .env.example .env
npm run docker:up
```

Default containerized stack:

- API: `http://localhost:4300`
- Postgres: `localhost:5437`
- Redis: `localhost:6383`

---

### Alerts

#### `GET /alerts`

Query: `page`, `limit`, `status` (firing|resolved|silenced), `severity`, `incidentId`, `sortBy`, `sortOrder`

#### `POST /alerts`

```http
POST /alerts
Content-Type: application/json

{
  "title": "High memory usage",
  "message": "Heap at 90% on worker-03",
  "severity": "high",
  "incidentId": "inc-1"
}
```

Response `201` — new alert with `status: "firing"`.

---

### Maintenance Windows

#### `GET /maintenance-windows`

Query: `page`, `limit`, `status` (scheduled|active|completed|cancelled), `teamId`, `sortBy` (createdAt|startsAt|endsAt), `sortOrder`

#### `POST /maintenance-windows`

```http
POST /maintenance-windows
Content-Type: application/json

{
  "title": "Database index rebuild",
  "description": "Rebuild analytics indexes",
  "teamId": "team-1",
  "startsAt": "2026-04-10T02:00:00.000Z",
  "endsAt": "2026-04-10T04:00:00.000Z"
}
```

Response `201` — new window with `status: "scheduled"`.

---

### Teams

#### `GET /teams/workload`

```http
GET /teams/workload
```

```json
{
  "data": [
    {
      "team": { "id": "team-1", "name": "Platform SRE" },
      "openIncidents": 1,
      "activeShifts": 2,
      "activeMaintenanceWindows": 1
    }
  ]
}
```

---

### Dashboard KPIs

#### `GET /dashboard/kpis`

```http
GET /dashboard/kpis
```

```json
{
  "mttaMinutes": 32,
  "mttrMinutes": 180,
  "openCriticalIncidents": 1,
  "alertVolume": {
    "last24h": 3,
    "last7d": 12,
    "last30d": 47
  }
}
```

- **MTTA** — mean minutes from `createdAt` to `acknowledgedAt` across all acknowledged incidents
- **MTTR** — mean minutes from `createdAt` to `resolvedAt` across all resolved/closed incidents  
- `null` when no data points exist

---

## Error responses

All errors follow a stable shape:

```json
{
  "error": "INVALID_TRANSITION",
  "message": "Cannot transition from 'resolved' to 'open'",
  "details": {}
}
```

| Code | Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Zod schema rejected the request body or query |
| `NOT_FOUND` | 404 | Resource does not exist |
| `INVALID_TRANSITION` | 422 | Incident status transition is not permitted |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Frontend integration (fetch examples)

```ts
const BASE = "http://localhost:4300";

// List open critical incidents
const res = await fetch(`${BASE}/incidents?status=open&severity=critical&sortBy=severity&sortOrder=desc`);
const { data, meta } = await res.json();

// Create an incident
const incident = await fetch(`${BASE}/incidents`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "Disk full on prod-db-01",
    description: "No space left on /data",
    severity: "critical",
    teamId: "team-1"
  })
}).then(r => r.json());

// Acknowledge it
await fetch(`${BASE}/incidents/${incident.id}/status`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ status: "investigating" })
});

// Poll KPIs every 30 seconds
setInterval(async () => {
  const kpis = await fetch(`${BASE}/dashboard/kpis`).then(r => r.json());
  console.log("MTTA:", kpis.mttaMinutes, "min | MTTR:", kpis.mttrMinutes, "min");
  console.log("Open critical:", kpis.openCriticalIncidents);
}, 30_000);

// Create a maintenance window
await fetch(`${BASE}/maintenance-windows`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "Nightly DB backup",
    teamId: "team-1",
    startsAt: new Date(Date.now() + 3_600_000).toISOString(),
    endsAt: new Date(Date.now() + 7_200_000).toISOString()
  })
});
```

## Required checks before merge

```bash
npm run skills:verify
npm run lint
npm run test
npm run build
```
