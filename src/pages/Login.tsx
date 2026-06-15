import { useState, type FormEvent } from 'react';
import { FirebaseError } from 'firebase/app';
import { sendEmailSignInLink, signInWithGoogle } from '../firebase/auth';

// Pantalla de login (US-00): "Continuar con Google" y enlace mágico por correo.
// La redirección tras autenticar la maneja App/AuthProvider.
export default function Login() {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [busy, setBusy] = useState<'google' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setError(null);
    setBusy('google');
    try {
      await signInWithGoogle();
    } catch (err) {
      if (!isPopupDismissed(err)) {
        setError('No se pudo entrar con Google. Inténtalo de nuevo.');
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleEmail(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy('email');
    try {
      await sendEmailSignInLink(email);
      setEmailSent(true);
    } catch (err) {
      console.error(err);
      setError('No se pudo enviar el enlace. Revisa el correo e inténtalo otra vez.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="login">
      <div className="login__brand">
        <div className="login__logo" aria-hidden="true">
          L
        </div>
        <h1 className="login__title">Lexia</h1>
        <p className="login__tagline">
          Colecciona y memoriza el vocabulario nuevo que descubres al leer.
        </p>
      </div>

      {emailSent ? (
        <div className="login__actions">
          <p className="login__sent">
            Te enviamos un enlace a <strong>{email}</strong>. Ábrelo en este
            dispositivo para entrar sin contraseña.
          </p>
          <button
            className="btn btn--ghost"
            onClick={() => {
              setEmailSent(false);
              setEmail('');
            }}
          >
            Usar otro correo
          </button>
        </div>
      ) : (
        <div className="login__actions">
          <button
            className="btn btn--primary"
            onClick={handleGoogle}
            disabled={busy !== null}
          >
            {busy === 'google' ? 'Conectando…' : 'Continuar con Google'}
          </button>

          <div className="login__divider">
            <span>o con tu correo</span>
          </div>

          <form className="login__form" onSubmit={handleEmail}>
            <input
              type="email"
              className="input"
              placeholder="tucorreo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <button className="btn" type="submit" disabled={busy !== null || !email}>
              {busy === 'email' ? 'Enviando…' : 'Enviarme un enlace'}
            </button>
          </form>

          {error && (
            <p className="login__error" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

// Cerrar el popup de Google no es un error que merezca mensaje.
function isPopupDismissed(err: unknown): boolean {
  return (
    err instanceof FirebaseError &&
    (err.code === 'auth/popup-closed-by-user' ||
      err.code === 'auth/cancelled-popup-request')
  );
}
