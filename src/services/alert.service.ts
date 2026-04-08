import { randomUUID } from "node:crypto";
import type { Severity } from "../schemas/common.js";
import { severityRank } from "../schemas/common.js";
import { type Alert, type AlertStatus } from "../schemas/alert.js";
import { store } from "../store/index.js";
import { Errors } from "../middleware/errors.js";

type SortField = "createdAt" | "updatedAt" | "severity";

export interface ListAlertsOptions {
  page: number;
  limit: number;
  status?: AlertStatus;
  severity?: Severity;
  incidentId?: string;
  sortBy: SortField;
  sortOrder: "asc" | "desc";
}

function compareAlerts(a: Alert, b: Alert, sortBy: SortField, sortOrder: "asc" | "desc"): number {
  let result: number;
  if (sortBy === "severity") {
    result = severityRank[a.severity] - severityRank[b.severity];
  } else {
    result = a[sortBy] < b[sortBy] ? -1 : a[sortBy] > b[sortBy] ? 1 : 0;
  }
  return sortOrder === "asc" ? result : -result;
}

export const alertService = {
  list(opts: ListAlertsOptions) {
    let items = [...store.alerts];

    if (opts.status) items = items.filter((a) => a.status === opts.status);
    if (opts.severity) items = items.filter((a) => a.severity === opts.severity);
    if (opts.incidentId) items = items.filter((a) => a.incidentId === opts.incidentId);

    items.sort((a, b) => compareAlerts(a, b, opts.sortBy, opts.sortOrder));

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

  create(input: {
    title: string;
    message: string;
    severity: Severity;
    incidentId?: string;
  }): Alert {
    if (input.incidentId) {
      const exists = store.incidents.some((i) => i.id === input.incidentId);
      if (!exists) throw Errors.notFound("Incident", input.incidentId);
    }

    const now = new Date().toISOString();
    const alert: Alert = {
      id: randomUUID(),
      title: input.title,
      message: input.message,
      severity: input.severity,
      status: "firing",
      incidentId: input.incidentId ?? null,
      createdAt: now,
      updatedAt: now
    };
    store.alerts.unshift(alert);
    return alert;
  }
};
