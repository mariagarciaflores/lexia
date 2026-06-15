import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Inicio', icon: '🏠', end: true },
  { to: '/agregar', label: 'Agregar', icon: '➕', end: false },
  { to: '/palabras', label: 'Palabras', icon: '📖', end: false },
  { to: '/repasar', label: 'Repasar', icon: '🔁', end: false },
  { to: '/jugar', label: 'Jugar', icon: '🎮', end: false },
  { to: '/ajustes', label: 'Ajustes', icon: '⚙️', end: false },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            'bottom-nav__item' + (isActive ? ' bottom-nav__item--active' : '')
          }
        >
          <span className="bottom-nav__icon" aria-hidden="true">
            {item.icon}
          </span>
          <span className="bottom-nav__label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
