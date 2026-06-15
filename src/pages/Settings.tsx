import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { logout } from '../firebase/auth';

export default function Settings() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    try {
      await logout();
    } catch (err) {
      console.error('No se pudo cerrar sesión:', err);
      setBusy(false);
    }
    // Si tiene éxito, AuthProvider actualiza el estado y App redirige a /login.
  }

  return (
    <section className="screen">
      <header className="screen__header">
        <h1 className="screen__title">Ajustes</h1>
      </header>

      <div className="card">
        <p className="card__label">Sesión iniciada como</p>
        <p className="card__value">{user?.displayName ?? 'Usuaria'}</p>
        {user?.email && <p className="card__sub">{user.email}</p>}
      </div>

      <button className="btn" onClick={handleLogout} disabled={busy}>
        {busy ? 'Cerrando…' : 'Cerrar sesión'}
      </button>

      <p className="screen__badge">
        Proveedor de definiciones y notificaciones · Fase 4 / 7
      </p>
    </section>
  );
}
