import { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { useSettings } from '../db/useSettings';
import { updateSettings } from '../db/settings';
import {
  disableNotifications,
  enableNotifications,
  notificationsSupported,
} from '../firebase/messaging';

// Ajustes de notificaciones de la palabra del día (US-09 CA1).
export default function NotificationsSettings() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    notificationsSupported().then(setSupported);
  }, []);

  async function handleToggle() {
    if (!user || busy) return;
    setMsg(null);
    setBusy(true);
    try {
      if (settings.notificationsEnabled) {
        await updateSettings(user.uid, { notificationsEnabled: false });
        await disableNotifications(user.uid);
      } else {
        const result = await enableNotifications(user.uid);
        if (result === 'granted') {
          await updateSettings(user.uid, {
            notificationsEnabled: true,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          });
        } else if (result === 'denied') {
          setMsg('Permiso de notificaciones denegado. Actívalo en los ajustes del navegador.');
        } else {
          setMsg('Este navegador no soporta notificaciones push.');
        }
      }
    } catch (err) {
      console.error('Error con las notificaciones:', err);
      setMsg('No se pudo cambiar la configuración. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  function handleTime(time: string) {
    if (!user) return;
    updateSettings(user.uid, { notificationTime: time }).catch((e) =>
      console.error('No se pudo guardar la hora:', e),
    );
  }

  function handleCount(count: number) {
    if (!user) return;
    updateSettings(user.uid, { wordsPerNotification: count }).catch((e) =>
      console.error('No se pudo guardar la cantidad:', e),
    );
  }

  if (supported === false) {
    return (
      <div className="card">
        <p className="card__label">Notificaciones</p>
        <p className="card__sub">Este navegador no soporta notificaciones push.</p>
      </div>
    );
  }

  const on = settings.notificationsEnabled;

  return (
    <div className="card">
      <div className="toggle-row">
        <div>
          <p className="card__label">Notificaciones</p>
          <p className="card__sub">Recibe la palabra del día a la hora que elijas.</p>
        </div>
        <button
          role="switch"
          aria-checked={on}
          className={'switch' + (on ? ' switch--on' : '')}
          onClick={handleToggle}
          disabled={busy || supported === null}
        >
          <span className="switch__knob" />
        </button>
      </div>

      {on && (
        <div className="notif-options">
          <label className="field field--row">
            <span className="field__label">Hora</span>
            <input
              type="time"
              className="input input--compact"
              value={settings.notificationTime}
              onChange={(e) => handleTime(e.target.value)}
            />
          </label>
          <label className="field field--row">
            <span className="field__label">Palabras por aviso</span>
            <select
              className="input input--compact"
              value={settings.wordsPerNotification}
              onChange={(e) => handleCount(Number(e.target.value))}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </label>
        </div>
      )}

      {msg && <p className="lookup__msg">{msg}</p>}
    </div>
  );
}
