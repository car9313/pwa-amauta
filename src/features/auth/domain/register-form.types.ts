import { z } from "zod";
import i18next from "i18next";

export const registerFormSchema = z.object({
  name: z.string().min(1, i18next.t("auth:validation.nameRequired")),
  email: z.string().email(i18next.t("auth:validation.emailInvalid")),
  password: z.string().min(6, i18next.t("auth:validation.passwordMinLength")),
  confirmPassword: z.string().min(6, i18next.t("auth:validation.confirmPasswordRequired")),
  role: z.enum(["parent"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: i18next.t("auth:validation.passwordMismatch"),
  path: ["confirmPassword"],
});

export type RegisterFormValues = z.infer<typeof registerFormSchema>;
