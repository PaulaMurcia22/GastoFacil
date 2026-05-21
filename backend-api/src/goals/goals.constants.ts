export const GOAL_STATUSES = ["active", "completed", "cancelled"] as const;

export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  active: "Activa",
  completed: "Completada",
  cancelled: "Cancelada",
};

