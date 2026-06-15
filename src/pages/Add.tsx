import { useNavigate } from 'react-router-dom';
import WordForm from '../components/WordForm';
import { useAuth } from '../auth/useAuth';
import { addWord, type WordInput } from '../db/words';

// Pantalla "Agregar". Por ahora captura manual; el autocompletado desde el
// diccionario gratuito (botón "Buscar definición") se añade en la Fase 4.
export default function Add() {
  const { user } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(input: WordInput) {
    if (!user) return;
    await addWord(user.uid, input);
    navigate('/palabras');
  }

  return (
    <section className="screen">
      <header className="screen__header">
        <h1 className="screen__title">Agregar palabra</h1>
      </header>
      <p className="screen__text">
        Escribe la palabra y, si quieres, su definición. Puedes guardar solo el
        término y completarla después.
      </p>

      <WordForm submitLabel="Guardar palabra" onSubmit={handleSubmit} />

      <p className="screen__badge">Autocompletado del diccionario · Fase 4</p>
    </section>
  );
}
