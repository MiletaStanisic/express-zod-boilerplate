import { store } from "../store/index.js";

export interface TeamWorkload {
  team: {
    id: string;
    name: string;
    description: string;
    createdAt: string;
  };
  openIncidents: number;
  activeShifts: number;
  activeMaintenanceWindows: number;
}

export const teamService = {
  workload(): TeamWorkload[] {
    const now = new Date();

    return store.teams.map((team) => {
      const openIncidents = store.incidents.filter(
        (i) =>
          i.teamId === team.id &&
          (i.status === "open" || i.status === "investigating")
      ).length;

      const activeShifts = store.shifts.filter(
        (s) =>
          s.teamId === team.id &&
          new Date(s.startsAt) <= now &&
          new Date(s.endsAt) >= now
      ).length;

      const activeMaintenanceWindows = store.maintenanceWindows.filter(
        (m) =>
          m.teamId === team.id &&
          (m.status === "active" || m.status === "scheduled")
      ).length;

      return { team, openIncidents, activeShifts, activeMaintenanceWindows };
    });
  }
};
