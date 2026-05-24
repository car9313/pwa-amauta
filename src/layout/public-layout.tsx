import { Suspense } from "react";
import { Outlet } from "react-router-dom";

function PublicFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Suspense fallback={<PublicFallback />}>
        <Outlet />
      </Suspense>
    </div>
  );
}