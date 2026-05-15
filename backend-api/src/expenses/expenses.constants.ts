export const EXPENSE_TYPES = ["fixed", "variable", "one_time"] as const;

export type ExpenseType = (typeof EXPENSE_TYPES)[number];

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  fixed: "Fijo",
  variable: "Variable",
  one_time: "Una sola vez",
};