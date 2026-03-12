// components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';

interface Props {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: Props) => {
  const user = useAppStore((state) => state.user); // en lugar de isAuthenticated

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};