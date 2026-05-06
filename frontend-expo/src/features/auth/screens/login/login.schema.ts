import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Ingresa un correo valido."),
  password: z
    .string()
    .min(8, "Ingresa tu contrasena."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
