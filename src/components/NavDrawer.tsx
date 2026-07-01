import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useTheme } from '../theme/ThemeContext';
import Icon from './Icon';
import LexiaLogo from './LexiaLogo';
import { NAV_ITEMS, getInitials } from './navItems';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NavDrawer({ open, onClose }: Props) {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();

  if (!open) return null;

  const initials = getInitials(user?.displayName, user?.email);
  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'Usuario';

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <nav className="drawer" aria-label="Menú de navegación">
        <div className="drawer__header">
          <LexiaLogo size={32} />
          <span className="drawer__title">Lexia</span>
        </div>

        <div className="drawer__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                'drawer__item' + (isActive ? ' drawer__item--active' : '')
              }
              onClick={onClose}
            >
              <Icon name={item.icon} size={21} />
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="drawer__spacer" />

        <div className="drawer__theme">
          <button
            className={
              'drawer__theme-btn' +
              (theme === 'light' ? ' drawer__theme-btn--active' : '')
            }
            onClick={() => theme !== 'light' && toggle()}
          >
            <Icon name="sun" size={16} />
            Claro
          </button>
          <button
            className={
              'drawer__theme-btn' + (theme === 'dark' ? ' drawer__theme-btn--active' : '')
            }
            onClick={() => theme !== 'dark' && toggle()}
          >
            <Icon name="moon" size={16} />
            Oscuro
          </button>
        </div>

        <div className="drawer__user">
          <span className="drawer__avatar">{initials}</span>
          <div className="drawer__user-info">
            <strong className="drawer__user-name">{displayName}</strong>
            {user?.email && <span className="drawer__user-email">{user.email}</span>}
          </div>
        </div>
      </nav>
    </>
  );
}
