import { useNavigate } from 'react-router-dom';
import WordForm from '../components/WordForm';
import { useAuth } from '../auth/useAuth';
import { useSettings } from '../db/useSettings';
import { addWord, type WordInput } from '../db/words';
import { getProvider } from '../providers';

// Pantalla "Agregar": captura una palabra con autocompletado desde el
// proveedor de definiciones elegido en Ajustes (US-01, US-02, US-12).
export default function Add() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const provider = getProvider(settings.definitionProvider);

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
        {provider.canFetch
          ? 'Escribe la palabra y toca “Buscar definición”, o complétala a mano. Puedes guardar solo el término.'
          : 'Captura manual activa. Escribe los campos a mano; puedes guardar solo el término.'}
      </p>

      <WordForm submitLabel="Guardar palabra" onSubmit={handleSubmit} provider={provider} />
    </section>
  );
}
