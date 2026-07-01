import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Icon from './Icon';
import { getPageTitle } from './navItems';

export default function TopBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const title = getPageTitle(pathname);
  const query = params.get('q') ?? '';

  function handleSearch(value: string) {
    const target = `/palabras${value ? `?q=${encodeURIComponent(value)}` : ''}`;
    // Si ya estamos en Palabras, reemplaza para no llenar el historial.
    navigate(target, { replace: pathname === '/palabras' });
  }

  return (
    <header className="topbar">
      <span className="topbar__title">{title}</span>
      <div className="topbar__actions">
        <div className="topbar__search">
          <Icon name="search" size={18} />
          <input
            className="topbar__search-input"
            type="search"
            placeholder="Buscar palabra…"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            aria-label="Buscar palabra"
          />
        </div>
        <button className="topbar__btn" aria-label="Notificaciones">
          <Icon name="bell" size={20} />
        </button>
      </div>
    </header>
  );
}
