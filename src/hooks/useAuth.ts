// src/hooks/useAuth.ts
// ============================================================
// Hooks de autenticación con TanStack Query
// ============================================================

import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { login, register, logout, getParentDashboard, getStudentProgress } from '@/services/auth.service'
import type { LoginCredentials, RegisterData, ParentDashboard, StudentProgress } from '@/types/auth.types'
import { useAuthStore } from '@/features/auth/presentation/store/auth-store'
import { redirectToDashboard, redirectToRoles, resolveAuthRole } from '@/features/auth/presentation/routing/auth-navigation'

export const authKeys = {
  all: ['auth'] as const,
  login: () => [...authKeys.all, 'login'] as const,
  register: () => [...authKeys.all, 'register'] as const,
  parentDashboard: (parentId: string) => ['auth', 'parent', parentId] as const,
  studentProgress: (studentId: string) => ['auth', 'progress', studentId] as const,
}

// ============================================================
// Login
// ============================================================

export function useLogin() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const selectedRole = useAuthStore((state) => state.selectedRole)
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated)
  const setRole = useAuthStore((state) => state.setRole)
  const setUser = useAuthStore((state) => state.setUser)

  const mutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: authKeys.all })
      setAuthenticated(true)
      setUser(result.user)
      const resolvedRole = resolveAuthRole(selectedRole, result.user.role as 'student' | 'parent')
      if (resolvedRole) {
        setRole(resolvedRole)
        redirectToDashboard(navigate, resolvedRole)
      } else {
        redirectToRoles(navigate)
      }
    },
  })

  return {
    login: mutation.mutate,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

// ============================================================
// Register
// ============================================================

export function useRegister() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const setAuthenticated = useAuthStore((state) => state.setAuthenticated)
  const setUser = useAuthStore((state) => state.setUser)

  const mutation = useMutation({
    mutationFn: (data: RegisterData) => register(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: authKeys.all })
      setAuthenticated(true)
      setUser(result.user)
      navigate('/roles')
    },
  })

  return {
    register: mutation.mutate,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

// ============================================================
// Logout (no es mutation, es función directa)
// ============================================================

export function useLogout() {
  return () => logout()
}

// ============================================================
// Parent Dashboard
// ============================================================

export function useParentDashboard(parentId: string) {
  return useQuery<ParentDashboard, Error>({
    queryKey: authKeys.parentDashboard(parentId),
    queryFn: () => getParentDashboard(parentId),
    staleTime: Number(import.meta.env.VITE_QUERY_STALE_TIME ?? 60) * 1000,
    enabled: !!parentId,
  })
}

// ============================================================
// Student Progress
// ============================================================

export function useStudentProgress(studentId: string) {
  return useQuery<StudentProgress, Error>({
    queryKey: authKeys.studentProgress(studentId),
    queryFn: () => getStudentProgress(studentId),
    staleTime: Number(import.meta.env.VITE_QUERY_STALE_TIME ?? 60) * 1000,
    enabled: !!studentId,
  })
}