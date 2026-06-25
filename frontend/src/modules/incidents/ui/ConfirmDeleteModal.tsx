import { useState } from 'preact/hooks';

interface Props {
  incidentId: number;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  error?: string | null;
}

export default function ConfirmDeleteModal({ incidentId, onClose, onConfirm, loading, error }: Props) {

  return (
    <div
      class="fixed inset-0 bg-pure-black/70 backdrop-blur-xs z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        class="relative max-w-md w-full bg-chalk border border-hairline rounded-[14px] overflow-hidden flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div class="flex items-center justify-between px-6 py-4 border-b border-hairline bg-chalk">
          <span class="text-sm font-semibold text-graphite">Confirmar Eliminación</span>
          <button
            onClick={onClose}
            class="text-concrete hover:text-pure-black transition-colors cursor-pointer w-9 h-9 flex items-center justify-center rounded-lg hover:bg-mist min-h-[36px]"
            aria-label="Cerrar confirmación"
            disabled={loading}
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div class="p-6 flex flex-col gap-4">
          {error && (
            <div class="p-3 border border-hairline bg-mist rounded-lg text-xs text-graphite">
              {error}
            </div>
          )}
          <div class="w-12 h-12 bg-mist rounded-full flex items-center justify-center border border-hairline text-graphite">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h4 class="text-sm font-semibold text-graphite">¿Estás seguro de que deseas eliminar este reporte?</h4>
            <p class="text-xs text-concrete mt-1">
              Esta acción realizará una eliminación lógica del reporte #{incidentId}. El reporte dejará de ser visible en el mural de incidencias del barrio.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div class="px-6 py-4 border-t border-hairline bg-mist/30 flex justify-end gap-3">
          <button
            onClick={onClose}
            class="inline-flex items-center justify-center text-xs font-semibold uppercase text-graphite bg-chalk border border-hairline rounded-lg px-4 h-11 hover:bg-mist transition-colors cursor-pointer min-h-[44px] select-none"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            class="inline-flex items-center justify-center text-xs font-semibold uppercase text-chalk bg-pure-black border border-pure-black rounded-lg px-4 h-11 hover:bg-carbon transition-colors cursor-pointer min-h-[44px] select-none disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Eliminando...' : 'Eliminar Reporte'}
          </button>
        </div>
      </div>
    </div>
  );
}
