import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Login from './pages/Login';
import Home from './pages/Home';
import Add from './pages/Add';
import MyWords from './pages/MyWords';
import Review from './pages/Review';
import Play from './pages/Play';
import Settings from './pages/Settings';

export default function App() {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <div className="app">
      <main className="app__content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route path="/agregar" element={<Add />} />
          <Route path="/palabras" element={<MyWords />} />
          <Route path="/repasar" element={<Review />} />
          <Route path="/jugar" element={<Play />} />
          <Route path="/ajustes" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isLogin && <BottomNav />}
    </div>
  );
}
