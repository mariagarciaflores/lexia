import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useTheme } from '../theme/ThemeContext';
import Icon from './Icon';
import LexiaLogo from './LexiaLogo';
import { NAV_ITEMS, getInitials } from './navItems';

export default function Sidebar() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();

  const initials = getInitials(user?.displayName, user?.email);
  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'Usuario';

  return (
    <aside className="sidebar" aria-label="Navegación principal">
      <div className="sidebar__header">
        <LexiaLogo size={34} />
        <span className="sidebar__title">Lexia</span>
      </div>

      <span className="sidebar__section">Menú</span>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              'sidebar__item' + (isActive ? ' sidebar__item--active' : '')
            }
          >
            <Icon name={item.icon} size={21} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__spacer" />

      <div className="sidebar__theme">
        <button
          className={
            'sidebar__theme-btn' + (theme === 'light' ? ' sidebar__theme-btn--active' : '')
          }
          onClick={() => theme !== 'light' && toggle()}
        >
          <Icon name="sun" size={17} />
          Claro
        </button>
        <button
          className={
            'sidebar__theme-btn' + (theme === 'dark' ? ' sidebar__theme-btn--active' : '')
          }
          onClick={() => theme !== 'dark' && toggle()}
        >
          <Icon name="moon" size={17} />
          Oscuro
        </button>
      </div>

      <div className="sidebar__user">
        <span className="sidebar__avatar">{initials}</span>
        <div className="sidebar__user-info">
          <strong className="sidebar__user-name">{displayName}</strong>
          {user?.email && <span className="sidebar__user-email">{user.email}</span>}
        </div>
      </div>
    </aside>
  );
}
