type Props = {
  title: string;
  description: string;
  phase: string;
};

// Componente provisional para las pantallas de la Fase 1.
// Cada pantalla se irá implementando en su fase correspondiente.
export default function Placeholder({ title, description, phase }: Props) {
  return (
    <section className="screen">
      <header className="screen__header">
        <h1 className="screen__title">{title}</h1>
      </header>
      <p className="screen__text">{description}</p>
      <p className="screen__badge">Por implementar · {phase}</p>
    </section>
  );
}
