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

export const goalSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Ingresa un nombre para la meta.")
    .max(120, "El nombre no puede superar los 120 caracteres."),
  targetAmount: z
    .string()
    .trim()
    .min(1, "Ingresa el monto objetivo.")
    .refine((value) => !Number.isNaN(parseAmount(value)), {
      message: "El monto objetivo debe ser un numero valido.",
    })
    .refine((value) => parseAmount(value) > 0, {
      message: "El monto objetivo debe ser mayor a 0.",
    }),
  categoryId: z.string().trim().min(1, "Selecciona una categoria."),
  deadline: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => {
        if (!value) {
          return true;
        }

        return isValidDateString(value);
      },
      {
        message: "Usa el formato YYYY-MM-DD para la fecha limite.",
      },
    ),
  description: z
    .string()
    .trim()
    .max(255, "La descripcion no puede superar los 255 caracteres.")
    .optional()
    .or(z.literal("")),
});

export type GoalFormValues = z.infer<typeof goalSchema>;

export function toGoalPayload(values: GoalFormValues) {
  return {
    name: values.name.trim(),
    targetAmount: parseAmount(values.targetAmount),
    categoryId: values.categoryId,
    deadline: values.deadline?.trim() || undefined,
    description: values.description?.trim() || undefined,
  };
}

