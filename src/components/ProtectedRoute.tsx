import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/useAuth';
import Loading from './Loading';

// Envuelve las pantallas que requieren sesión. Si no hay usuario, redirige
// a /login recordando a dónde quería ir el usuario.
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return <>{children}</>;
}
