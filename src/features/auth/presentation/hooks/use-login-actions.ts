import { useCallback } from "react"
import { useNavigate } from "react-router-dom"

import type { LoginFormValues } from "../../domain/login-form.types"
import { useAuthRedirectAfterHydration } from "./useAuthRedirectAfterHydration"
import { redirectToDashboard, redirectToRoles, resolveAuthRole } from "../routing/auth-navigation"
import { login as loginService } from "@/services/auth.service"
import { useAuthStore } from "../store/auth-store"
import type { LoginCredentials } from "@/types/auth.types"

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
    const credentials: LoginCredentials = {
      email: values.email,
      password: values.password,
    }

    const result = await loginService(credentials)

    setAuthenticated(true)
    setUser(result.user)

    const resolvedRole = resolveAuthRole(selectedRole, result.user.role as "student" | "parent")

    if (resolvedRole) {
      setRole(resolvedRole)
      redirectToDashboard(navigate, resolvedRole)
      return
    }

    redirectToRoles(navigate)
  }, [navigate, selectedRole, setAuthenticated, setRole, setUser])

  return { login, isReady }
}