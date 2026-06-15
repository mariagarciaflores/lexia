import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './auth/useAuth';
import { initForegroundNotifications } from './firebase/messaging';
import Login from './pages/Login';
import Home from './pages/Home';
import Add from './pages/Add';
import MyWords from './pages/MyWords';
import Review from './pages/Review';
import Play from './pages/Play';
import Settings from './pages/Settings';

export default function App() {
  const location = useLocation();
  const { user } = useAuth();
  const isLogin = location.pathname === '/login';

  // Muestra las notificaciones que llegan con la app abierta (si hay permiso).
  useEffect(() => {
    if (user) initForegroundNotifications();
  }, [user]);

  return (
    <div className="app">
      <main className="app__content">
        <Routes>
          {/* Si ya hay sesión, /login redirige a Inicio. */}
          <Route
            path="/login"
            element={user ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agregar"
            element={
              <ProtectedRoute>
                <Add />
              </ProtectedRoute>
            }
          />
          <Route
            path="/palabras"
            element={
              <ProtectedRoute>
                <MyWords />
              </ProtectedRoute>
            }
          />
          <Route
            path="/repasar"
            element={
              <ProtectedRoute>
                <Review />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jugar"
            element={
              <ProtectedRoute>
                <Play />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ajustes"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isLogin && user && <BottomNav />}
    </div>
  );
}
