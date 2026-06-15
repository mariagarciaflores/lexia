import { useNavigate } from 'react-router-dom';

// Pantalla de bienvenida. La autenticación real (Google + enlace por correo)
// se implementa en la Fase 2. Por ahora el botón solo entra a la app.
export default function Login() {
  const navigate = useNavigate();

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

      <div className="login__actions">
        <button className="btn btn--primary" disabled>
          Continuar con Google
        </button>
        <button className="btn" disabled>
          Entrar con enlace por correo
        </button>
        <p className="login__note">El inicio de sesión se activa en la Fase 2.</p>
        <button className="btn btn--ghost" onClick={() => navigate('/')}>
          Ver la app (demo)
        </button>
      </div>
    </section>
  );
}
