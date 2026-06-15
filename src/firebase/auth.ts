import {
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './config';

// Clave de localStorage donde guardamos el correo mientras el usuario
// abre el enlace mágico (puede abrirse en otra pestaña del mismo navegador).
const EMAIL_STORAGE_KEY = 'lexia:emailForSignIn';

// A dónde vuelve el enlace mágico. Debe estar en "Dominios autorizados" de
// Firebase Auth (localhost + tu dominio de Hosting).
function actionCodeSettings() {
  return {
    url: `${window.location.origin}/login`,
    handleCodeInApp: true,
  };
}

/** Login con Google mediante popup. */
export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(auth, googleProvider);
}

/** Envía el enlace mágico al correo y recuerda el correo localmente. */
export async function sendEmailSignInLink(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  await sendSignInLinkToEmail(auth, normalized, actionCodeSettings());
  window.localStorage.setItem(EMAIL_STORAGE_KEY, normalized);
}

/** ¿La URL actual es un enlace mágico de inicio de sesión? */
export function isEmailSignInLink(url: string = window.location.href): boolean {
  return isSignInWithEmailLink(auth, url);
}

/**
 * Completa el login cuando se abre el enlace mágico.
 * Recupera el correo de localStorage; si no está (otro dispositivo/navegador),
 * lo pide al usuario. Luego limpia la URL para quitar el código del enlace.
 */
export async function completeEmailLinkSignIn(): Promise<void> {
  let email = window.localStorage.getItem(EMAIL_STORAGE_KEY);
  if (!email) {
    email = window.prompt('Confirma tu correo para terminar de entrar:');
  }
  if (!email) {
    throw new Error('No se pudo confirmar el correo para iniciar sesión.');
  }

  await signInWithEmailLink(auth, email.trim().toLowerCase(), window.location.href);
  window.localStorage.removeItem(EMAIL_STORAGE_KEY);

  // Quita el código del enlace de la barra de direcciones sin recargar.
  window.history.replaceState(null, '', window.location.origin + '/login');
}

/** Cierra la sesión actual. */
export async function logout(): Promise<void> {
  await signOut(auth);
}

/**
 * Crea el documento de perfil users/{uid} en el primer ingreso.
 * Usa merge para no pisar datos existentes y solo fija createdAt al crearlo.
 */
export async function ensureUserProfile(user: User): Promise<void> {
  const ref = doc(db, 'users', user.uid);
  const snapshot = await getDoc(ref);
  if (snapshot.exists()) return;

  await setDoc(
    ref,
    {
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}
