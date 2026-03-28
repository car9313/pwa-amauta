import { useNavigate } from "react-router-dom";
import { logoutUseCase } from "../../auth.di";
import { useAuthStore } from "../store/auth-store";

export function useLogout() {
  const navigate = useNavigate();
  const clearSession = useAuthStore((s) => s.clearSession);

  const logout = async () => {
    await logoutUseCase();
    clearSession();
    navigate("/login", { replace: true });
  };

  return { logout };
}