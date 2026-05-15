export const INCOME_PERIODICITIES = [
  "monthly",
  "biweekly",
  "one_time",
] as const;

export type IncomePeriodicity = (typeof INCOME_PERIODICITIES)[number];

export const INCOME_PERIODICITY_LABELS: Record<IncomePeriodicity, string> = {
  monthly: "Mensual",
  biweekly: "Quincenal",
  one_time: "Unico",
};
