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

function parseFrequencyMonths(value: string): number {
  return Number(value.trim());
}

export const expenseSchema = z
  .object({
    amount: z
      .string()
      .trim()
      .min(1, "Ingresa el monto del gasto.")
      .refine((value) => !Number.isNaN(parseAmount(value)), {
        message: "El monto debe ser un numero valido.",
      })
      .refine((value) => parseAmount(value) > 0, {
        message: "El monto debe ser mayor a 0.",
      }),
    expenseDate: z
      .string()
      .trim()
      .min(1, "Ingresa la fecha del gasto.")
      .refine(isValidDateString, {
        message: "Usa el formato YYYY-MM-DD para la fecha.",
      }),
    categoryId: z.string().trim().min(1, "Selecciona una categoria."),
    expenseType: z.enum(["fixed", "variable", "one_time"], {
      message: "Selecciona el tipo de gasto.",
    }),
    frequencyMonths: z.string().trim().optional().or(z.literal("")),
    description: z
      .string()
      .trim()
      .max(255, "La descripcion no puede superar los 255 caracteres.")
      .optional()
      .or(z.literal("")),
  })
  .superRefine((values, context) => {
    if (values.expenseType === "variable") {
      if (!values.frequencyMonths) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ingresa la frecuencia en meses.",
          path: ["frequencyMonths"],
        });
        return;
      }

      const parsedFrequency = parseFrequencyMonths(values.frequencyMonths);

      if (Number.isNaN(parsedFrequency) || parsedFrequency < 1) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La frecuencia debe ser un numero mayor a 0.",
          path: ["frequencyMonths"],
        });
      }
    }
  });

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

export function toExpensePayload(values: ExpenseFormValues) {
  return {
    amount: parseAmount(values.amount),
    expenseDate: values.expenseDate.trim(),
    categoryId: values.categoryId,
    expenseType: values.expenseType,
    frequencyMonths:
      values.expenseType === "variable" && values.frequencyMonths
        ? parseFrequencyMonths(values.frequencyMonths)
        : undefined,
    description: values.description?.trim() || undefined,
  };
}