import { randomUUID } from "node:crypto";
import type { Severity } from "../schemas/common.js";
import { severityRank } from "../schemas/common.js";
import {
  VALID_TRANSITIONS,
  type Incident,
  type IncidentStatus
} from "../schemas/incident.js";
import { store } from "../store/index.js";
import { Errors } from "../middleware/errors.js";

type SortField = "createdAt" | "updatedAt" | "severity";

export interface ListIncidentsOptions {
  page: number;
  limit: number;
  status?: IncidentStatus;
  severity?: Severity;
  teamId?: string;
  sortBy: SortField;
  sortOrder: "asc" | "desc";
}

function compareIncidents(a: Incident, b: Incident, sortBy: SortField, sortOrder: "asc" | "desc"): number {
  let result: number;
  if (sortBy === "severity") {
    result = severityRank[a.severity] - severityRank[b.severity];
  } else {
    result = a[sortBy] < b[sortBy] ? -1 : a[sortBy] > b[sortBy] ? 1 : 0;
  }
  return sortOrder === "asc" ? result : -result;
}

export const incidentService = {
  list(opts: ListIncidentsOptions) {
    let items = [...store.incidents];

    if (opts.status) items = items.filter((i) => i.status === opts.status);
    if (opts.severity) items = items.filter((i) => i.severity === opts.severity);
    if (opts.teamId) items = items.filter((i) => i.teamId === opts.teamId);

    items.sort((a, b) => compareIncidents(a, b, opts.sortBy, opts.sortOrder));

    const total = items.length;
    const offset = (opts.page - 1) * opts.limit;
    const data = items.slice(offset, offset + opts.limit);

    return {
      data,
      meta: {
        page: opts.page,
        limit: opts.limit,
        total,
        totalPages: Math.ceil(total / opts.limit)
      }
    };
  },

  getById(id: string): Incident {
    const incident = store.incidents.find((i) => i.id === id);
    if (!incident) throw Errors.notFound("Incident", id);
    return incident;
  },

  create(input: {
    title: string;
    description: string;
    severity: Severity;
    teamId: string;
  }): Incident {
    const now = new Date().toISOString();
    const incident: Incident = {
      id: randomUUID(),
      title: input.title,
      description: input.description,
      severity: input.severity,
      status: "open",
      teamId: input.teamId,
      createdAt: now,
      updatedAt: now,
      acknowledgedAt: null,
      resolvedAt: null
    };
    store.incidents.unshift(incident);
    return incident;
  },

  transition(id: string, newStatus: IncidentStatus): Incident {
    const incident = incidentService.getById(id);
    const valid = VALID_TRANSITIONS[incident.status];

    if (!valid.includes(newStatus)) {
      throw Errors.invalidTransition(incident.status, newStatus);
    }

    const now = new Date().toISOString();
    incident.status = newStatus;
    incident.updatedAt = now;

    if (incident.status === "investigating" && !incident.acknowledgedAt) {
      incident.acknowledgedAt = now;
    }
    if (incident.status === "resolved" && !incident.resolvedAt) {
      incident.resolvedAt = now;
    }

    return incident;
  }
};
