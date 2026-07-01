import { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { subscribeWords, type Word } from './words';

type WordsState = {
  words: Word[];
  loading: boolean;
  error: string | null;
};

// Suscribe en tiempo real a las palabras del usuario autenticado.
// Gracias a la persistencia offline de Firestore, sirve datos de caché sin red.
export function useWords(): WordsState {
  const { user } = useAuth();
  const [state, setState] = useState<WordsState>({
    words: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!user) {
      setState({ words: [], loading: false, error: null });
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));
    const unsubscribe = subscribeWords(
      user.uid,
      (words) => setState({ words, loading: false, error: null }),
      (error) => {
        console.error('Error al leer las palabras:', error);
        setState({
          words: [],
          loading: false,
          error: 'No se pudieron cargar tus palabras.',
        });
      },
    );
    return unsubscribe;
  }, [user]);

  return state;
}
