import { useNavigate } from "react-router-dom";

import type { RegisterFormValues } from "../../domain/register-form.types";
import { useAuthRedirectAfterHydration } from "./useAuthRedirectAfterHydration";
import { redirectToDashboard, redirectToRoles, resolveAuthRole } from "../routing/auth-navigation";
import { registerUseCase } from "../../auth.di";
import { useAuthStore } from "../store/auth-store";

type UseRegisterActionsResult = {
  register: (values: RegisterFormValues) => Promise<void>;
  isReady: boolean;
};

export function useRegisterActions(): UseRegisterActionsResult {
  const navigate = useNavigate();
  const { isReady } = useAuthRedirectAfterHydration();

  const selectedRole = useAuthStore((s) => s.selectedRole);
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const setRole = useAuthStore((s) => s.setRole);
  const setUser = useAuthStore((s) => s.setUser);

  const register = async (values: RegisterFormValues): Promise<void> => {
    const result = await registerUseCase({
      name: values.name,
      email: values.email,
      password: values.password,
    });

    setAuthenticated(true);
    setUser(result.user);

    const resolvedRole = resolveAuthRole(selectedRole, result.user.role);

    if (resolvedRole) {
      setRole(resolvedRole);
      redirectToDashboard(navigate, resolvedRole);
      return;
    }

    redirectToRoles(navigate);
  };

  return { register, isReady };
}