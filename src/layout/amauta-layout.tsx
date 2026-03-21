import { Outlet } from "react-router-dom";
import { AppHeader } from "./app-header";

export function AmautaLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
       <AppHeader /> 
      <main className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}