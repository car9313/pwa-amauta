import { useNavigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import i18next from "i18next"
import { Home, BookOpen, Gamepad2, BarChart3, Users, LogOut, X } from "lucide-react"

import { useAuthStore } from "@/features/auth/presentation/store/auth-store"
import { Character } from "./character"
import { cn } from "@/lib/utils"

interface NavigationMenuProps {
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  path: string
  label: string
  icon: typeof Home
}

const menuItems: NavItem[] = [
  { path: "/dashboard", label: i18next.t("navigation:navItems.dashboard"), icon: Home },
  { path: "/lessons", label: i18next.t("navigation:navItems.lessons"), icon: BookOpen },
  { path: "/practice", label: i18next.t("navigation:navItems.practice"), icon: BarChart3 },
  { path: "/games", label: i18next.t("navigation:navItems.games"), icon: Gamepad2 },
  { path: "/progress", label: i18next.t("navigation:navItems.progress"), icon: BarChart3 },
  { path: "/parent", label: i18next.t("navigation:navItems.parentPanel"), icon: Users },
]

function NavigationMenu({ isOpen, onClose }: NavigationMenuProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)

  const handleNavigate = (path: string) => {
    navigate(path)
    onClose()
  }

  const handleLogout = async () => {
    await clearSession()
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-bold text-foreground">{t("navigation:menu.menuTitle")}</span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>

          <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
            <Character size="sm" />
            <div>
              <p className="font-semibold text-foreground">{user?.name ?? t("navigation:menu.userLabel")}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {user?.role === "student" ? t("navigation:menu.studentRole") : user?.role === "parent" ? t("navigation:menu.parentRole") : t("navigation:menu.teacherRole")}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-center mb-3">
            <Character size="md" />
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{t("navigation:menu.logoutButton")}</span>
          </button>
        </div>
      </div>
    </>
  )
}

export { NavigationMenu }
export type { NavigationMenuProps }
