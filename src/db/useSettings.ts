import { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { DEFAULT_SETTINGS, subscribeSettings, type UserSettings } from './settings';

type SettingsState = {
  settings: UserSettings;
  loading: boolean;
};

// Suscribe a los ajustes del usuario autenticado, con valores por defecto
// mientras cargan o si aún no se han guardado.
export function useSettings(): SettingsState {
  const { user } = useAuth();
  const [state, setState] = useState<SettingsState>({
    settings: DEFAULT_SETTINGS,
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setState({ settings: DEFAULT_SETTINGS, loading: false });
      return;
    }
    const unsubscribe = subscribeSettings(
      user.uid,
      (settings) => setState({ settings, loading: false }),
      (error) => {
        console.error('Error al leer los ajustes:', error);
        setState({ settings: DEFAULT_SETTINGS, loading: false });
      },
    );
    return unsubscribe;
  }, [user]);

  return state;
}
