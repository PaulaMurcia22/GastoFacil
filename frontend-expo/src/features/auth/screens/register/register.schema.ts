import { z } from "zod";

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, "Ingresa tu nombre completo."),
    email: z
      .string()
      .trim()
      .email("Ingresa un correo valido."),
    password: z
      .string()
      .min(8, "La clave debe tener minimo 8 caracteres.")
      .regex(/[A-Z]/, "Incluye al menos una letra mayuscula.")
      .regex(/[0-9]/, "Incluye al menos un numero."),
    confirmPassword: z.string().min(8, "Confirma la clave."),
    age: z
      .string()
      .trim()
      .refine((value) => {
        const parsed = Number(value);
        return Number.isInteger(parsed) && parsed >= 13 && parsed <= 100;
      }, "La edad debe estar entre 13 y 100."),
    nickname: z
      .string()
      .trim()
      .min(2, "Ingresa tu nickname."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las claves no coinciden.",
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
