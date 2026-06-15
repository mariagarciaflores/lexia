// Pantalla de carga mientras se resuelve el estado de autenticación.
export default function Loading() {
  return (
    <div className="loading" role="status" aria-live="polite">
      <span className="loading__spinner" aria-hidden="true" />
      <span className="loading__text">Cargando…</span>
    </div>
  );
}
