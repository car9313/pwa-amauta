import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;