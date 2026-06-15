import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { logout } from '../firebase/auth';
import { useSettings } from '../db/useSettings';
import { updateSettings } from '../db/settings';
import { PROVIDERS, type ProviderId } from '../providers';

export default function Settings() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [busy, setBusy] = useState(false);

  async function handleProvider(id: ProviderId) {
    if (!user || id === settings.definitionProvider) return;
    try {
      await updateSettings(user.uid, { definitionProvider: id });
    } catch (err) {
      console.error('No se pudo guardar el proveedor:', err);
    }
  }

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

      <div className="card">
        <p className="card__label">Proveedor de definiciones</p>
        <div className="option-list">
          {PROVIDERS.map((p) => {
            const active = settings.definitionProvider === p.id;
            return (
              <button
                key={p.id}
                className={'option' + (active ? ' option--active' : '')}
                onClick={() => handleProvider(p.id)}
              >
                <span className="option__radio" aria-hidden="true" />
                <span>
                  <span className="option__name">{p.name}</span>
                  <span className="option__desc">
                    {p.canFetch
                      ? 'Autocompleta desde una API de diccionario gratuita.'
                      : 'Escribes la definición a mano.'}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <button className="btn" onClick={handleLogout} disabled={busy}>
        {busy ? 'Cerrando…' : 'Cerrar sesión'}
      </button>

      <p className="screen__badge">Notificaciones · Fase 7</p>
    </section>
  );
}
