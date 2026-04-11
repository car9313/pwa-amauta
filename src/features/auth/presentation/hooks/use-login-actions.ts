import { useCallback } from "react"
import { useNavigate } from "react-router-dom"

import type { LoginFormValues } from "../../domain/login-form.types"
import { useAuthRedirectAfterHydration } from "./useAuthRedirectAfterHydration"
import { redirectToDashboard, redirectToRoles, resolveAuthRole } from "../routing/auth-navigation"
import { loginUseCase } from "../../auth.di"
import { useAuthStore } from "../store/auth-store"

type UseLoginActionsResult = {
  login: (values: LoginFormValues) => Promise<void>
  isReady: boolean
}

export function useLoginActions(): UseLoginActionsResult {
  const navigate = useNavigate()
  const { isReady } = useAuthRedirectAfterHydration()

  const selectedRole = useAuthStore((state) => state.selectedRole)
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated)
  const setRole = useAuthStore((state) => state.setRole)
  const setUser = useAuthStore((state) => state.setUser)

  const login = useCallback(async (values: LoginFormValues): Promise<void> => {
    const result = await loginUseCase(values)

    setAuthenticated(true)
    setUser(result.user)

    const resolvedRole = resolveAuthRole(selectedRole, result.user.role)

    if (resolvedRole) {
      setRole(resolvedRole)
      redirectToDashboard(navigate, resolvedRole)
      return
    }

    redirectToRoles(navigate)
  }, [navigate, selectedRole, setAuthenticated, setRole, setUser])

  return { login, isReady }
}