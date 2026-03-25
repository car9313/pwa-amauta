import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth-store";
import { logoutUseCase } from "../application/auth.use-cases";

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