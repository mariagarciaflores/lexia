import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import LexiaLogo from './LexiaLogo';

interface Props {
  onMenuClick: () => void;
}

export default function AppBar({ onMenuClick }: Props) {
  const navigate = useNavigate();

  return (
    <header className="appbar">
      <button className="appbar__btn" onClick={onMenuClick} aria-label="Abrir menú">
        <Icon name="menu" size={22} />
      </button>
      <div className="appbar__brand">
        <LexiaLogo size={26} />
        <span className="appbar__name">Lexia</span>
      </div>
      <div className="appbar__spacer" />
      <button
        className="appbar__btn"
        onClick={() => navigate('/palabras?focus=1')}
        aria-label="Buscar"
      >
        <Icon name="search" size={21} />
      </button>
    </header>
  );
}
