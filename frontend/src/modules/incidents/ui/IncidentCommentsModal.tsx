import { useEffect, useState } from 'preact/hooks';
import { useScrollLock } from '../../../shared/hooks/useScrollLock';
import { HttpIncidentRepository } from '../infrastructure/HttpIncidentRepository';
import { GetIncidentCommentsUseCase } from '../application/use-cases/GetIncidentCommentsUseCase';
import type { Comment } from '../domain/entities/Comment';

interface Props {
  apiUrl: string;
  token: string;
  incidentId: number;
  onClose: () => void;
}

export default function IncidentCommentsModal({ apiUrl, token, incidentId, onClose }: Props) {
  useScrollLock(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      setError(null);
      const repository = new HttpIncidentRepository();
      const useCase = new GetIncidentCommentsUseCase(repository);
      try {
        const data = await useCase.execute(apiUrl, token, incidentId);
        setComments(data);
      } catch (err: any) {
        setError(err.message || 'Error al cargar los comentarios.');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [apiUrl, token, incidentId]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-EC', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      class="fixed inset-0 bg-pure-black/70 backdrop-blur-xs z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        class="relative max-w-xl w-full bg-chalk border border-hairline rounded-[14px] overflow-hidden flex flex-col shadow-xl max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div class="flex items-center justify-between px-6 py-4 border-b border-hairline bg-chalk bg-chalk">
          <div>
            <h3 class="text-base font-semibold text-graphite">Comentarios del Reporte</h3>
            <p class="text-xs text-concrete">Reporte #{incidentId}</p>
          </div>
          <button
            onClick={onClose}
            class="text-concrete hover:text-pure-black transition-colors cursor-pointer w-9 h-9 flex items-center justify-center rounded-lg hover:bg-mist min-h-[44px]"
            aria-label="Cerrar comentarios"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div class="p-6 overflow-y-auto bg-chalk flex-1 flex flex-col gap-4">
          {loading ? (
            <div class="py-12 text-center">
              <div class="inline-block animate-pulse w-6 h-6 border-2 border-concrete border-t-transparent rounded-full mb-3"></div>
              <p class="text-sm text-concrete font-medium">Cargando comentarios...</p>
            </div>
          ) : error ? (
            <div class="py-12 text-center">
              <p class="text-sm text-concrete mb-4 font-medium">{error}</p>
            </div>
          ) : comments.length === 0 ? (
            <div class="py-12 text-center">
              <p class="text-sm text-concrete font-medium">No hay comentarios en este reporte.</p>
            </div>
          ) : (
            <div class="flex flex-col gap-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  class="bg-mist/50 border border-hairline rounded-lg p-4 flex flex-col gap-1.5"
                >
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-xs font-semibold text-graphite">
                      Usuario #{comment.usuarioId}
                    </span>
                    <span class="text-[10px] text-concrete font-mono">
                      {formatDate(comment.fechaCreacion)}
                    </span>
                  </div>
                  <p class="text-sm text-graphite leading-relaxed whitespace-pre-wrap">
                    {comment.mensaje}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
