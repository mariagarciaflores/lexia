interface Props {
  size?: number;
}

// Logo Lexia: libro abierto (literatura) + brote de dos hojas (vocabulario que
// crece) sobre cuadrado magenta. Geometría tomada del diseño (claude.ai/design).
export default function LexiaLogo({ size = 32 }: Props) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      role="img"
      aria-label="Lexia"
      style={{ display: 'block' }}
    >
      <rect x="3" y="3" width="42" height="42" rx="13" fill="#cb48b7" />
      {/* Páginas del libro */}
      <path
        d="M24 17.5 C20 15.5 16 15.5 12.5 16.8 L12.5 29.5 C16 28.2 20 28.2 24 30.2 Z"
        fill="#f6f4ee"
      />
      <path
        d="M24 17.5 C28 15.5 32 15.5 35.5 16.8 L35.5 29.5 C32 28.2 28 28.2 24 30.2 Z"
        fill="#e4e3d3"
      />
      <line x1="24" y1="17.5" x2="24" y2="30.2" stroke="#cb48b7" strokeWidth="1.4" />
      {/* Tallo */}
      <path
        d="M24 17.5 C24 14 24 12 24 9.5"
        stroke="#2e2d4d"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Hojas del brote */}
      <path d="M24 13 C20.5 12.5 18 10 18.8 7 C21.2 8.4 23.2 10.6 24 13 Z" fill="#6d9f71" />
      <path d="M24 13 C27.5 12.5 30 10 29.2 7 C26.8 8.4 24.8 10.6 24 13 Z" fill="#337357" />
    </svg>
  );
}
