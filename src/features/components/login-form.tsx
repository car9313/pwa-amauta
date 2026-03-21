import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "../auth/store/auth-store";
import { Input } from "@/components/ui/input";


type LoginFormProps = {
  onSubmit: (values: { email: string; password: string }) => void;
};

export function LoginForm({ onSubmit }: LoginFormProps) {
  const role = useAuthStore((state) => state.role);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSubmit({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
  };

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl text-foreground">Iniciar sesión</CardTitle>
        <p className="text-sm text-muted-foreground">
          {role
            ? `Accediendo como ${role === "student" ? "estudiante" : "padre o madre"}`
            : "Selecciona primero un perfil"}
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
  );
}