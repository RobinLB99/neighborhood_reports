import { useState } from 'preact/hooks';
import { HttpIncidentRepository } from '../infrastructure/HttpIncidentRepository';
import { AddIncidentCommentUseCase } from '../application/use-cases/AddIncidentCommentUseCase';

interface Props {
  apiUrl: string;
  token: string;
  incidentId: number;
  onSuccess?: () => void;
}

export default function IncidentCommentForm({ apiUrl, token, incidentId, onSuccess }: Props) {
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    const repository = new HttpIncidentRepository();
    const useCase = new AddIncidentCommentUseCase(repository);

    try {
      await useCase.execute(apiUrl, token, incidentId, message);
      setSuccess(true);
      setMessage('');
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al enviar el comentario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="mt-4 border-t border-hairline pt-4 flex flex-col gap-3">
      <div class="relative">
        <textarea
          value={message}
          onInput={(e) => setMessage((e.target as HTMLTextAreaElement).value)}
          placeholder="Escribe un comentario..."
          maxLength={500}
          disabled={loading || success}
          class="w-full min-h-[90px] border border-hairline rounded-lg bg-chalk text-graphite text-sm p-3 focus:outline-none focus:border-concrete transition-colors resize-y placeholder:text-concrete/60"
        />
        <div class="absolute bottom-2 right-3 text-[10px] text-concrete font-mono">
          {message.length}/500
        </div>
      </div>

      {error && (
        <div class="text-xs text-concrete bg-mist border border-hairline rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {success && (
        <div class="text-xs text-graphite bg-mist border border-hairline rounded-lg px-3 py-2 flex items-center gap-1.5 font-medium">
          <svg class="w-4 h-4 text-graphite" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Comentario publicado exitosamente
        </div>
      )}

      <div class="flex justify-end">
        <button
          type="submit"
          disabled={loading || success || !message.trim()}
          class="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-chalk bg-graphite border border-graphite rounded-lg px-5 h-11 hover:bg-carbon hover:border-carbon transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[44px]"
        >
          {loading && (
            <span class="inline-block animate-pulse w-3 h-3 border-2 border-chalk border-t-transparent rounded-full"></span>
          )}
          <span>{loading ? 'Enviando...' : 'Enviar'}</span>
        </button>
      </div>
    </form>
  );
}
