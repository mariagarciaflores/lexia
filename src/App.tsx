import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppBar from './components/AppBar';
import NavDrawer from './components/NavDrawer';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const isLogin = location.pathname === '/login';

  useEffect(() => {
    if (user) initForegroundNotifications();
  }, [user]);

  const chrome = !isLogin && user;

  return (
    <div className={chrome ? 'app app--chrome' : 'app'}>
      {chrome && <Sidebar />}
      <div className="app__shell">
        {chrome && (
          <>
            <AppBar onMenuClick={() => setDrawerOpen(true)} />
            <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
            <TopBar />
          </>
        )}
        <main className="app__content">
          <Routes>
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
      </div>
    </div>
  );
}
