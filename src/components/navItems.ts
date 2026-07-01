import type { ComponentProps } from 'react';
import type Icon from './Icon';

type IconName = ComponentProps<typeof Icon>['name'];

export type NavItem = {
  to: string;
  label: string;
  icon: IconName;
  end: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Inicio', icon: 'home', end: true },
  { to: '/agregar', label: 'Agregar', icon: 'plus', end: false },
  { to: '/palabras', label: 'Palabras', icon: 'book', end: false },
  { to: '/repasar', label: 'Repasar', icon: 'review', end: false },
  { to: '/jugar', label: 'Jugar', icon: 'play', end: false },
  { to: '/ajustes', label: 'Ajustes', icon: 'settings', end: false },
];

/** Iniciales para el avatar (máx. 2 letras). */
export function getInitials(
  displayName: string | null | undefined,
  email: string | null | undefined,
): string {
  if (displayName) {
    return displayName
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }
  return (email?.[0] ?? 'U').toUpperCase();
}

/** Título de la pantalla actual a partir de la ruta (para el TopBar de escritorio). */
export function getPageTitle(pathname: string): string {
  const item = NAV_ITEMS.find((i) =>
    i.end ? pathname === i.to : pathname.startsWith(i.to),
  );
  return item?.label ?? 'Lexia';
}
