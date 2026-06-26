import { useEffect, useState } from 'preact/hooks';
import { useScrollLock } from '../../../shared/hooks/useScrollLock';
import { GetIncidentsUseCase } from '../application/use-cases/GetIncidentsUseCase';
import { HttpIncidentRepository } from '../infrastructure/HttpIncidentRepository';
import type { Incident } from '../domain/entities/Incident';
import IncidentSupportButton from './IncidentSupportButton';
import IncidentCommentForm from './IncidentCommentForm';
import IncidentCommentsModal from './IncidentCommentsModal';
import DirectiveManagementModal from './DirectiveManagementModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';


interface Props {
  apiUrl: string;
  token: string;
  userRole?: string;
  currentUserId?: number;
}

export default function IncidentsFeed({ apiUrl, token, userRole, currentUserId }: Props) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  useScrollLock(!!selectedPhoto);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCommentIncidentIds, setActiveCommentIncidentIds] = useState<Record<number, boolean>>({});
  const [viewCommentsIncidentId, setViewCommentsIncidentId] = useState<number | null>(null);
  const [selectedDirectiveIncidentId, setSelectedDirectiveIncidentId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Estados para paginación por cursor
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // Estados para eliminación lógica
  const [deleteIncidentId, setDeleteIncidentId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);


  const toggleCommentForm = (incidentId: number) => {
    setActiveCommentIncidentIds((prev) => ({
      ...prev,
      [incidentId]: !prev[incidentId],
    }));
  };

  const fetchIncidents = () => {
    setLoading(true);
    const repository = new HttpIncidentRepository();
    const useCase = new GetIncidentsUseCase(repository);

    const apiFilter = statusFilter === 'all' ? undefined : statusFilter;

    useCase.execute(apiUrl, token, apiFilter, 10, undefined)
      .then((data) => {
        setIncidents(data.incidents);
        setNextCursor(data.nextCursor);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Error al cargar los reportes.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const loadMoreIncidents = () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);

    const repository = new HttpIncidentRepository();
    const useCase = new GetIncidentsUseCase(repository);

    const apiFilter = statusFilter === 'all' ? undefined : statusFilter;

    useCase.execute(apiUrl, token, apiFilter, 10, nextCursor)
      .then((data) => {
        setIncidents((prev) => [...prev, ...data.incidents]);
        setNextCursor(data.nextCursor);
      })
      .catch((err) => {
        console.error('Error al cargar más reportes:', err);
        alert(err.message || 'Error al cargar más reportes.');
      })
      .finally(() => {
        setLoadingMore(false);
      });
  };

  const handleDeleteIncident = async () => {
    if (!deleteIncidentId) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`${apiUrl}/api/incidents/${deleteIncidentId}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Error al intentar eliminar el reporte.');
      }
      setIncidents((prev) => prev.filter((inc) => inc.id !== deleteIncidentId));
      setDeleteIncidentId(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Hubo un error de red al intentar eliminar el reporte.');
    } finally {
      setDeleteLoading(false);
    }
  };


  useEffect(() => {
    fetchIncidents();
  }, [apiUrl, token, statusFilter]);

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
    <div class="mt-10">
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold text-graphite tracking-tight">Mural de Reportes</h2>
          <p class="text-xs text-concrete mt-1">Listado de incidencias en tu barrio.</p>
        </div>
        <div class="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter((e.target as HTMLSelectElement).value)}
            class="text-xs font-semibold px-3 py-1.5 border border-hairline bg-chalk text-graphite rounded-lg focus:outline-none focus:border-concrete transition-colors cursor-pointer min-h-[44px]"
          >
            <option value="all">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="en_gestion">En Gestión</option>
            <option value="solucionado">Solucionados</option>
          </select>
          <span class="text-xs font-semibold px-3 py-1 border border-hairline bg-mist text-graphite rounded-[26px] min-h-[26px] flex items-center">
            {incidents.length} {incidents.length === 1 ? 'reporte' : 'reportes'}
          </span>
        </div>
      </div>

      {loading ? (
        <div class="py-16 text-center mt-4">
          <div class="inline-block animate-pulse w-6 h-6 border-2 border-concrete border-t-transparent rounded-full mb-3"></div>
          <p class="text-sm text-concrete font-medium">Cargando mural de reportes...</p>
        </div>
      ) : error ? (
        <div class="py-16 px-6 text-center mt-4">
          <div class="w-12 h-12 bg-mist rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-6 h-6 text-concrete" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p class="text-sm text-concrete mb-6 font-medium">{error}</p>
          <button
            onClick={fetchIncidents}
            class="inline-flex items-center justify-center text-xs font-semibold uppercase text-pure-black border border-pure-black rounded-lg px-5 h-11 hover:bg-mist transition-colors cursor-pointer min-h-[44px]"
          >
            Reintentar
          </button>
        </div>
      ) : incidents.length === 0 ? (
        <div class="py-16 text-center">
          <div class="w-12 h-12 bg-mist rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-6 h-6 text-concrete" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p class="text-sm text-concrete font-medium">No hay incidencias activas en este momento.</p>
        </div>
      ) : (
        <div class="flex flex-col gap-6">
          {incidents.map((incident) => (
            <article 
              key={incident.id} 
              class="bg-chalk border border-hairline rounded-[14px] p-6 transition-colors hover:border-concrete/30 flex flex-col"
            >
              {/* Header: Estado y Identificadores */}
              <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-2">
                  <span
                    class={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 border rounded-[26px] ${
                      incident.estado === 'pendiente'
                        ? 'border-ash text-concrete bg-mist'
                        : incident.estado === 'en_gestion'
                        ? 'border-graphite text-graphite bg-chalk'
                        : 'border-hairline text-concrete bg-chalk opacity-70'
                    }`}
                  >
                    {incident.estado === 'pendiente'
                      ? 'Pendiente'
                      : incident.estado === 'en_gestion'
                      ? 'En Gestión'
                      : 'Solucionado'}
                  </span>
                </div>
                <div class="flex items-center gap-3">
                  <div class="flex items-center gap-1.5 text-xs text-concrete font-mono">
                    <span>#{incident.id}</span>
                    <span class="text-hairline">•</span>
                    <span>{formatDate(incident.fechaCreacion)}</span>
                  </div>
                  {((userRole === 'lider' || userRole === 'miembro') || 
                    (userRole === 'ciudadano' && incident.usuarioId === currentUserId)) && (
                    <button
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteIncidentId(incident.id);
                      }}
                      class="shrink-0 flex items-center justify-center text-concrete hover:text-rose-500 hover:bg-rose-50/50 border border-hairline hover:border-rose-200 rounded-lg w-8 h-8 transition-colors cursor-pointer select-none"
                      aria-label="Eliminar este reporte"
                      title="Eliminar reporte"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Body: Descripción */}
              <div class="mt-4">
                <p class="text-sm md:text-base text-graphite leading-relaxed font-normal whitespace-pre-wrap">
                  {incident.descripcion}
                </p>
              </div>

              {/* Media: Imagen */}
              {incident.fotoUrl && (
                <div class="mt-4 border border-hairline rounded-[10px] overflow-hidden bg-mist">
                  <button
                    onClick={() => setSelectedPhoto(incident.fotoUrl)}
                    class="w-full aspect-video md:aspect-[16/10] focus:outline-none hover:opacity-95 transition-opacity cursor-pointer block relative group"
                    aria-label="Ver foto a tamaño completo"
                  >
                    <img
                      src={incident.fotoUrl}
                      alt={`Foto del reporte #${incident.id}`}
                      class="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div class="absolute inset-0 bg-pure-black/0 group-hover:bg-pure-black/5 transition-colors flex items-center justify-center">
                      <span class="bg-chalk/90 border border-hairline text-graphite text-xs font-semibold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm pointer-events-none">
                        Ampliar Imagen
                      </span>
                    </div>
                  </button>
                </div>
              )}

              {/* Footer: Dirección y Enlace al mapa */}
              <div class="mt-5 border-t border-hairline pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-start gap-2 text-xs text-concrete min-w-0">
                  <svg class="w-4 h-4 text-concrete shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span class="truncate leading-relaxed" title={incident.direccion}>
                    {incident.direccion}
                  </span>
                </div>
                <div class="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <IncidentSupportButton apiUrl={apiUrl} token={token} incidentId={incident.id} />
                  
                  <button
                    onClick={() => toggleCommentForm(incident.id)}
                    class={`shrink-0 inline-flex items-center justify-center gap-0 sm:gap-1.5 text-xs font-semibold border rounded-lg w-11 sm:w-auto px-0 sm:px-4 h-11 transition-colors cursor-pointer min-h-[44px] select-none ${
                      activeCommentIncidentIds[incident.id]
                        ? 'bg-graphite text-chalk border-graphite hover:bg-carbon hover:border-carbon'
                        : 'bg-chalk text-graphite border-hairline hover:bg-mist'
                    }`}
                    aria-label="Comentar este reporte"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span class="hidden sm:inline">Comentar</span>
                  </button>

                  {(userRole === 'lider' || userRole === 'miembro') && (
                    <>
                      <button
                        onClick={() => setViewCommentsIncidentId(incident.id)}
                        class="shrink-0 inline-flex items-center justify-center gap-0 sm:gap-1.5 text-xs font-semibold bg-chalk text-graphite border border-hairline rounded-lg w-11 sm:w-auto px-0 sm:px-4 h-11 hover:bg-mist transition-colors cursor-pointer min-h-[44px] select-none"
                        aria-label="Ver comentarios de este reporte"
                      >
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span class="hidden sm:inline">Ver Comentarios</span>
                      </button>

                      <button
                        onClick={() => setSelectedDirectiveIncidentId(incident.id)}
                        class="shrink-0 inline-flex items-center justify-center gap-0 sm:gap-1.5 text-xs font-semibold bg-chalk text-graphite border border-hairline rounded-lg w-11 sm:w-auto px-0 sm:px-4 h-11 hover:bg-mist transition-colors cursor-pointer min-h-[44px] select-none"
                        aria-label="Gestión directiva de este reporte"
                      >
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span class="hidden sm:inline">Gestión Directiva</span>
                      </button>
                    </>
                  )}


                  {incident.ubicacion && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${incident.ubicacion}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="shrink-0 inline-flex items-center justify-center gap-0 sm:gap-1.5 text-xs font-medium text-graphite border border-hairline rounded-lg w-11 sm:w-auto px-0 sm:px-4 h-11 hover:bg-mist transition-colors cursor-pointer min-h-[44px] flex-initial"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <span class="hidden sm:inline">Ver en Google Maps</span>
                    </a>
                  )}
                </div>

              </div>

              {activeCommentIncidentIds[incident.id] && (
                <IncidentCommentForm
                  apiUrl={apiUrl}
                  token={token}
                  incidentId={incident.id}
                  onSuccess={() => toggleCommentForm(incident.id)}
                />
              )}
            </article>
          ))}

          {nextCursor && (
            <div class="mt-4 flex justify-center">
              <button
                onClick={loadMoreIncidents}
                disabled={loadingMore}
                class="inline-flex items-center justify-center text-xs font-semibold uppercase text-pure-black border border-pure-black rounded-lg px-6 h-11 hover:bg-mist transition-colors cursor-pointer min-h-[44px] w-full sm:w-auto disabled:opacity-50 select-none"
              >
                {loadingMore ? (
                  <>
                    <span class="inline-block animate-pulse w-4 h-4 border-2 border-pure-black border-t-transparent rounded-full mr-2"></span>
                    Cargando...
                  </>
                ) : (
                  'Cargar Más Reportes'
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de foto en tamaño completo */}
      {selectedPhoto && (
        <div
          class="fixed inset-0 bg-pure-black/70 backdrop-blur-xs z-[100] flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            class="relative max-w-4xl w-full bg-chalk border border-hairline rounded-[14px] overflow-hidden flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="flex items-center justify-between px-6 py-4 border-b border-hairline bg-chalk">
              <span class="text-sm font-semibold text-graphite">Detalle de Fotografía</span>
              <button
                onClick={() => setSelectedPhoto(null)}
                class="text-concrete hover:text-pure-black transition-colors cursor-pointer w-9 h-9 flex items-center justify-center rounded-lg hover:bg-mist min-h-[36px]"
                aria-label="Cerrar modal"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="p-6 flex items-center justify-center bg-mist overflow-hidden min-h-[300px]">
              <img
                src={selectedPhoto}
                alt="Fotografía de la incidencia en tamaño completo"
                class="max-w-full max-h-[70vh] object-contain rounded-lg border border-hairline bg-chalk"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de comentarios */}
      {viewCommentsIncidentId !== null && (
        <IncidentCommentsModal
          apiUrl={apiUrl}
          token={token}
          incidentId={viewCommentsIncidentId}
          onClose={() => setViewCommentsIncidentId(null)}
        />
      )}

      {/* Modal de gestión directiva */}
      {selectedDirectiveIncidentId !== null && (
        <DirectiveManagementModal
          apiUrl={apiUrl}
          token={token}
          incidentId={selectedDirectiveIncidentId}
          onClose={() => setSelectedDirectiveIncidentId(null)}
          onSuccess={() => {
            fetchIncidents();
          }}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      {deleteIncidentId !== null && (
        <ConfirmDeleteModal
          incidentId={deleteIncidentId}
          loading={deleteLoading}
          error={deleteError}
          onClose={() => setDeleteIncidentId(null)}
          onConfirm={handleDeleteIncident}
        />
      )}
    </div>
  );
}
