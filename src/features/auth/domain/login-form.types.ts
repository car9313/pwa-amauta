import { z } from "zod";
import i18next from "i18next";

export const loginFormSchema = z.object({
  email: z.string().email(i18next.t("auth:validation.emailInvalid")),
  password: z.string().min(6, i18next.t("auth:validation.passwordMinLength")),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;