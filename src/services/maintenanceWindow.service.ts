import { randomUUID } from "node:crypto";
import {
  type MaintenanceStatus,
  type MaintenanceWindow
} from "../schemas/maintenanceWindow.js";
import { store } from "../store/index.js";

type SortField = "createdAt" | "startsAt" | "endsAt";

export interface ListMaintenanceWindowsOptions {
  page: number;
  limit: number;
  status?: MaintenanceStatus;
  teamId?: string;
  sortBy: SortField;
  sortOrder: "asc" | "desc";
}

export const maintenanceWindowService = {
  list(opts: ListMaintenanceWindowsOptions) {
    let items = [...store.maintenanceWindows];

    if (opts.status) items = items.filter((m) => m.status === opts.status);
    if (opts.teamId) items = items.filter((m) => m.teamId === opts.teamId);

    items.sort((a, b) => {
      const result = a[opts.sortBy] < b[opts.sortBy] ? -1 : a[opts.sortBy] > b[opts.sortBy] ? 1 : 0;
      return opts.sortOrder === "asc" ? result : -result;
    });

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
    description: string;
    teamId: string;
    startsAt: string;
    endsAt: string;
  }): MaintenanceWindow {
    const now = new Date().toISOString();
    const window: MaintenanceWindow = {
      id: randomUUID(),
      title: input.title,
      description: input.description,
      teamId: input.teamId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      status: "scheduled",
      createdAt: now,
      updatedAt: now
    };
    store.maintenanceWindows.unshift(window);
    return window;
  }
};
