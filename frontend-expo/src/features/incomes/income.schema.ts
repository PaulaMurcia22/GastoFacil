import { z } from "zod";

function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);

  return !Number.isNaN(date.getTime());
}

function parseAmount(value: string): number {
  return Number(value.replace(",", "."));
}

export const incomeSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, "Ingresa el monto del ingreso.")
    .refine((value) => !Number.isNaN(parseAmount(value)), {
      message: "El monto debe ser un numero valido.",
    })
    .refine((value) => parseAmount(value) > 0, {
      message: "El monto debe ser mayor a 0.",
    }),
  incomeDate: z
    .string()
    .trim()
    .min(1, "Ingresa la fecha del ingreso.")
    .refine(isValidDateString, {
      message: "Usa el formato YYYY-MM-DD para la fecha.",
    }),
  categoryId: z.string().trim().min(1, "Selecciona una categoria."),
  periodicity: z.string().trim().min(1, "Selecciona la periodicidad."),
  description: z
    .string()
    .trim()
    .max(255, "La descripcion no puede superar los 255 caracteres.")
    .optional()
    .or(z.literal("")),
});

export type IncomeFormValues = z.infer<typeof incomeSchema>;

export function toIncomePayload(values: IncomeFormValues) {
  return {
    amount: parseAmount(values.amount),
    incomeDate: values.incomeDate.trim(),
    categoryId: values.categoryId,
    periodicity: values.periodicity as "monthly" | "biweekly" | "one_time",
    description: values.description?.trim() || undefined,
  };
}
