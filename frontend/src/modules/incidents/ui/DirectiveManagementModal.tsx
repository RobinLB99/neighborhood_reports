import { useEffect, useState } from 'preact/hooks';
import { HttpIncidentRepository } from '../infrastructure/HttpIncidentRepository';
import { GetIncidentGestionesUseCase } from '../application/use-cases/GetIncidentGestionesUseCase';
import type { Gestion } from '../domain/entities/Gestion';

interface Props {
  apiUrl: string;
  token: string;
  incidentId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DirectiveManagementModal({ apiUrl, token, incidentId, onClose, onSuccess }: Props) {
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form states
  const [estadoAsignado, setEstadoAsignado] = useState<'pendiente' | 'en_gestion' | 'solucionado'>('en_gestion');
  const [mensaje, setMensaje] = useState<string>('');

  useEffect(() => {
    const fetchGestiones = async () => {
      setLoading(true);
      setError(null);
      const repository = new HttpIncidentRepository();
      const useCase = new GetIncidentGestionesUseCase(repository);
      try {
        const data = await useCase.execute(apiUrl, token, incidentId);
        setGestiones(data);
      } catch (err: any) {
        setError(err.message || 'Error al cargar el historial de gestiones.');
      } finally {
        setLoading(false);
      }
    };

    fetchGestiones();
  }, [incidentId, apiUrl, token]);

  const formatDate = (dateStr: string) => {
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

  const getStatusBadgeClass = (status: 'pendiente' | 'en_gestion' | 'solucionado') => {
    switch (status) {
      case 'pendiente':
        return 'border-ash text-concrete bg-mist';
      case 'en_gestion':
        return 'border-graphite text-graphite bg-chalk';
      case 'solucionado':
        return 'border-pure-black text-chalk bg-pure-black';
      default:
        return 'border-hairline text-concrete bg-mist';
    }
  };

  const getStatusLabel = (status: 'pendiente' | 'en_gestion' | 'solucionado') => {
    switch (status) {
      case 'pendiente':
        return 'Pendiente';
      case 'en_gestion':
        return 'En Gestión';
      case 'solucionado':
        return 'Solucionado';
      default:
        return status;
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!mensaje.trim()) {
      setSubmitError('El mensaje justificativo de la gestión es obligatorio.');
      return;
    }

    setSubmitLoading(true);
    setSubmitError(null);

    try {
      const response = await fetch(`${apiUrl}/api/incidents/${incidentId}/management`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          estadoAsignado,
          mensaje,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || 'Error al guardar la gestión directiva.');
      }

      const resJson = await response.json();
      
      // Si la API tiene éxito, agregamos el nuevo registro al historial local mockeado
      // para que el usuario experimente reactividad inmediata en la interfaz.
      const newGestion: Gestion = {
        id: resJson.data?.id || Date.now(),
        reporteId: incidentId,
        liderId: resJson.data?.liderId || 0,
        estadoAsignado: estadoAsignado,
        mensaje: mensaje,
        fechaGestion: resJson.data?.fechaGestion || new Date().toISOString(),
      };

      setGestiones((prev) => [newGestion, ...prev]);
      setMensaje('');
      setSubmitError(null);
      
      // Notificamos éxito al feed padre para refrescar estados principales
      onSuccess();
    } catch (err: any) {
      setSubmitError(err.message || 'Hubo un problema al conectar con el servidor.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div
      class="fixed inset-0 bg-pure-black/70 backdrop-blur-xs z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        class="relative max-w-5xl w-full bg-chalk border border-hairline rounded-[14px] overflow-hidden flex flex-col shadow-xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div class="flex items-center justify-between px-6 py-4 border-b border-hairline bg-chalk">
          <div>
            <h3 class="text-base font-semibold text-graphite">Gestión Directiva del Reporte</h3>
            <p class="text-xs text-concrete">Reporte #{incidentId}</p>
          </div>
          <button
            onClick={onClose}
            class="text-concrete hover:text-pure-black transition-colors cursor-pointer w-9 h-9 flex items-center justify-center rounded-lg hover:bg-mist min-h-[44px]"
            aria-label="Cerrar gestión directiva"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Dos columnas en pantallas medianas y superiores */}
        <div class="flex flex-col md:flex-row overflow-y-auto divide-y md:divide-y-0 md:divide-x divide-hairline">
          
          {/* Columna Izquierda: Historial de Gestiones */}
          <div class="flex-1 p-6 flex flex-col gap-4 overflow-y-auto max-h-[45vh] md:max-h-[70vh]">
            <h4 class="text-sm font-semibold text-graphite uppercase tracking-wider mb-2">
              Historial de Gestiones Directivas
            </h4>

            {loading ? (
              <div class="py-12 text-center flex-1 flex flex-col items-center justify-center">
                <div class="inline-block animate-pulse w-6 h-6 border-2 border-concrete border-t-transparent rounded-full mb-3"></div>
                <p class="text-sm text-concrete font-medium">Cargando historial...</p>
              </div>
            ) : error ? (
              <div class="py-12 text-center flex-1 flex flex-col items-center justify-center">
                <p class="text-sm text-concrete font-medium">{error}</p>
              </div>
            ) : gestiones.length === 0 ? (
              <div class="py-12 text-center flex-1 flex flex-col items-center justify-center">
                <p class="text-sm text-concrete font-medium">No se registran gestiones administrativas previas.</p>
              </div>
            ) : (
              <div class="flex flex-col gap-4">
                {gestiones.map((g) => (
                  <div
                    key={g.id}
                    class="bg-mist/50 border border-hairline rounded-lg p-4 flex flex-col gap-2"
                  >
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-semibold text-graphite">
                          {g.nombreLider || `Líder ID #${g.liderId}`}
                        </span>
                        <span
                          class={`inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-[26px] ${getStatusBadgeClass(
                            g.estadoAsignado
                          )}`}
                        >
                          {getStatusLabel(g.estadoAsignado)}
                        </span>
                      </div>
                      <span class="text-[10px] text-concrete font-mono">
                        {g.fechaGestion ? formatDate(g.fechaGestion) : ''}
                      </span>
                    </div>
                    <p class="text-sm text-graphite leading-relaxed whitespace-pre-wrap">
                      {g.mensaje}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Columna Derecha: Formulario para añadir nueva gestión */}
          <div class="w-full md:w-[380px] p-6 bg-chalk flex flex-col gap-4">
            <h4 class="text-sm font-semibold text-graphite uppercase tracking-wider">
              Registrar Nueva Acción
            </h4>

            <form onSubmit={handleSubmit} class="flex flex-col gap-4">
              {submitError && (
                <div class="p-3 border border-hairline bg-mist rounded-lg text-xs text-graphite">
                  {submitError}
                </div>
              )}

              {/* Selector de Estado */}
              <div class="flex flex-col gap-1.5">
                <label htmlFor="estadoAsignado" class="text-xs font-semibold text-graphite">
                  Nuevo Estado de Asignación
                </label>
                <select
                  id="estadoAsignado"
                  value={estadoAsignado}
                  onChange={(e) => setEstadoAsignado((e.target as HTMLSelectElement).value as any)}
                  class="w-full bg-chalk border border-hairline rounded-lg px-3 text-sm text-graphite focus:outline-none focus:border-concrete transition-colors cursor-pointer min-h-[44px]"
                  disabled={submitLoading}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_gestion">En Gestión</option>
                  <option value="solucionado">Solucionado</option>
                </select>
              </div>

              {/* Mensaje justificativo */}
              <div class="flex flex-col gap-1.5">
                <label htmlFor="mensaje" class="text-xs font-semibold text-graphite">
                  Mensaje / Bitácora
                </label>
                <textarea
                  id="mensaje"
                  rows={5}
                  value={mensaje}
                  onInput={(e) => setMensaje((e.target as HTMLTextAreaElement).value)}
                  placeholder="Detalla los avances o justificación del cambio de estado..."
                  class="w-full bg-chalk border border-hairline rounded-lg p-3 text-sm text-graphite focus:outline-none focus:border-concrete transition-colors resize-none placeholder:text-concrete"
                  disabled={submitLoading}
                />
              </div>

              {/* Botón de Enviar */}
              <button
                type="submit"
                disabled={submitLoading}
                class="w-full inline-flex items-center justify-center text-xs font-semibold uppercase text-chalk bg-graphite hover:bg-carbon border border-graphite rounded-lg px-5 h-11 transition-colors cursor-pointer min-h-[44px] disabled:opacity-50"
              >
                {submitLoading ? 'Registrando...' : 'Registrar Gestión'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
