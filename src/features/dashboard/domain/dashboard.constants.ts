export const DASHBOARD_ACTIONS = {
  COMPLETED: "completed",
  LEVEL_UP: "level_up",
  ACHIEVEMENT: "achievement",
  ATTENTION: "attention",
} as const

export type DashboardAction = (typeof DASHBOARD_ACTIONS)[keyof typeof DASHBOARD_ACTIONS]

export const ACTION_DISPLAY_MAP: Record<DashboardAction, string> = {
  [DASHBOARD_ACTIONS.COMPLETED]: "Completó",
  [DASHBOARD_ACTIONS.LEVEL_UP]: "Nivel",
  [DASHBOARD_ACTIONS.ACHIEVEMENT]: "logro",
  [DASHBOARD_ACTIONS.ATTENTION]: "atención",
}

export function matchAction(action: string): DashboardAction | null {
  const entry = Object.entries(ACTION_DISPLAY_MAP).find(
    ([, display]) => action.includes(display),
  )
  return entry ? (entry[0] as DashboardAction) : null
}
