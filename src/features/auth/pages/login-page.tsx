import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { getDashboardPath } from "../utils/get-dashboard-path";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginPage() {
  const navigate = useNavigate();
  const selectedRole = useAuthStore((state) => state.selectedRole);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setRole = useAuthStore((state) => state.setRole);

  const handleLoginSuccess = () => {
    setAuthenticated(true);

    if (selectedRole) {
      setRole(selectedRole);
      navigate(getDashboardPath(selectedRole), { replace: true });
      return;
    }

    navigate("/roles", { replace: true });
  };

  return (
    <div className="flex justify-center items-center h-screen">
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl text-foreground">Iniciar sesión</CardTitle>
        </CardHeader>
      <CardContent>
        <form onSubmit={handleLoginSuccess} className="space-y-4">
          <div className="space-y-2">
            <Input 
            id="email"
             name="email"
              type="email"
               placeholder="correo@ejemplo.com" 
              className="h-12 rounded-md border-border"
            />
          </div>
          <div className="space-y-2">
            <Input 
            id="password" 
            name="password" 
            type="password" 
            placeholder="••••••••" 
             className="h-12 rounded-md border-border"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-amauta-orange text-white hover:bg-amauta-orange-dark"
          >
            Entrar
          </Button>
          <button
          type="button"
         /*  onClick={onRegisterClick}
          */ className="w-full text-center text-muted-foreground hover:text-foreground transition-colors"
        >
          Registrarme soy nuevo
        </button>
        </form>
    
       </CardContent>
    </Card>
 </div>   
  );
}