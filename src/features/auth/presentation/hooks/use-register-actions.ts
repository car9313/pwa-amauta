import { useCallback } from "react"
import { useNavigate } from "react-router-dom"

import type { RegisterFormValues } from "../../domain/register-form.types"
import { useAuthRedirectAfterHydration } from "./useAuthRedirectAfterHydration"
import { redirectToDashboard, redirectToRoles, resolveAuthRole } from "../routing/auth-navigation"
import { register as registerService } from "@/services/auth.service"
import { useAuthStore } from "../store/auth-store"
import type { RegisterData } from "@/types/auth.types"

type UseRegisterActionsResult = {
  register: (values: RegisterFormValues & { role?: "student" | "parent" }) => Promise<void>
  isReady: boolean
}

export function useRegisterActions(): UseRegisterActionsResult {
  const navigate = useNavigate()
  const { isReady } = useAuthRedirectAfterHydration()

  const selectedRole = useAuthStore((s) => s.selectedRole)
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated)
  const setRole = useAuthStore((s) => s.setRole)
  const setUser = useAuthStore((s) => s.setUser)

  const register = useCallback(async (values: RegisterFormValues & { role?: "student" | "parent" }): Promise<void> => {
    const data: RegisterData = {
      name: values.name,
      email: values.email,
      password: values.password,
      role: values.role ?? selectedRole ?? "student",
    }

    const result = await registerService(data)

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

  return { register, isReady }
}