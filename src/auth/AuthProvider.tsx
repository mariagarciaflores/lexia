import { useEffect, useRef, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase/config';
import {
  completeEmailLinkSignIn,
  ensureUserProfile,
  isEmailSignInLink,
} from '../firebase/auth';
import { AuthContext } from './AuthContext';

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Si la URL es un enlace mágico, no terminamos de cargar hasta resolverlo,
  // para no parpadear a la pantalla de login antes de autenticar.
  const pendingEmailLink = useRef(isEmailSignInLink());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (nextUser) {
        try {
          await ensureUserProfile(nextUser);
        } catch (err) {
          console.error('No se pudo crear/leer el perfil del usuario:', err);
        }
      }
      setUser(nextUser);
      if (!pendingEmailLink.current || nextUser) {
        setLoading(false);
      }
    });

    if (pendingEmailLink.current) {
      completeEmailLinkSignIn().catch((err) => {
        console.error('Error al completar el enlace por correo:', err);
        pendingEmailLink.current = false;
        setLoading(false);
      });
    }

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
  );
}
