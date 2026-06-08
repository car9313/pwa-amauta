import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export interface FallbackProps {
  error: Error;
  resetError: () => void;
  isNetworkError?: boolean;
}

interface GenericFallbackProps extends FallbackProps {
  title?: string;
  message?: string;
  showHome?: boolean;
}

export function GenericFallback({
  error,
  resetError,
  isNetworkError,
  title = isNetworkError ? "Error de conexión" : "Algo salió mal",
  message = isNetworkError
    ? "No pudimos conectar con el servidor. Verifica tu conexión a internet."
    : "Encontramos un problema. Puedes intentar de nuevo.",
  showHome = true,
}: GenericFallbackProps) {
  return (
    <div className="flex min-h-[200px] w-full items-center justify-center p-4">
      <Card className="w-full max-w-md border-red-200 bg-red-50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl text-red-800">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-red-700">{message}</p>
          {error.message && (
            <p className="text-xs text-red-600 bg-red-100 p-2 rounded">
              {error.message}
            </p>
          )}
          <div className="flex gap-2 justify-center">
            <Button
              onClick={resetError}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {isNetworkError ? "Reintentar conexión" : "Intentar de nuevo"}
            </Button>
            {showHome && !isNetworkError && (
              <Button
                onClick={() => window.location.href = "/"}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <Home className="mr-2 h-4 w-4" />
                Ir al inicio
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function StudentFallback({ resetError, isNetworkError }: FallbackProps) {
  return (
    <div className="flex min-h-[300px] w-full items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 bg-white shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-[#f4701f]/10">
            <AlertTriangle className="h-10 w-10 text-[#f4701f]" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#1f4fa3]">
            {isNetworkError ? "¡Ups! No hay internet" : "¡Ups! Algo se atravesó"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-base text-slate-600">
            {isNetworkError
              ? "Parece que no hay conexión a internet. Pídele a un adulto que revise."
              : "Tuviste un pequeño percance. ¡No te preocupes! Puedes intentarlo de nuevo."}
          </p>
          <div className="flex flex-col gap-2">
            <Button
              onClick={resetError}
              className="w-full bg-[#f4701f] hover:bg-[#ea601b]"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {isNetworkError ? "¡Verificar de nuevo!" : "¡Intentar de nuevo!"}
            </Button>
            <Button
              onClick={() => window.location.href = "/"}
              variant="outline"
              className="w-full border-2 border-slate-200"
            >
              <Home className="mr-2 h-4 w-4" />
              Volver al inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ParentFallback({ error, resetError, isNetworkError }: FallbackProps) {
  return (
    <div className="flex min-h-[250px] w-full items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-200">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <CardTitle className="text-lg text-slate-800">
            {isNetworkError ? "Error de conexión" : "Error inesperado"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-center">
          <p className="text-sm text-slate-600">
            {isNetworkError
              ? "No se pudo conectar con el servidor. Revisa tu conexión a internet."
              : "Hubo un problema al cargar esta sección. Por favor, intenta de nuevo."}
          </p>
          {import.meta.env.DEV && error.message && (
            <p className="text-xs bg-slate-100 p-2 rounded text-left font-mono">
              {error.message}
            </p>
          )}
          <div className="flex gap-2 justify-center pt-2">
            <Button onClick={resetError} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              {isNetworkError ? "Reintentar conexión" : "Reintentar"}
            </Button>
            <Button
              onClick={() => window.location.href = "/"}
              variant="outline"
            >
              <Home className="mr-2 h-4 w-4" />
              Inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default {
  GenericFallback,
  StudentFallback,
  ParentFallback,
};