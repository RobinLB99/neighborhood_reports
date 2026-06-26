import { useEffect, useState } from 'preact/hooks';
import { HttpIncidentRepository } from '../infrastructure/HttpIncidentRepository';
import { GetIncidentSupportsUseCase } from '../application/use-cases/GetIncidentSupportsUseCase';
import { ToggleIncidentSupportUseCase } from '../application/use-cases/ToggleIncidentSupportUseCase';

interface Props {
  apiUrl: string;
  token: string;
  incidentId: number;
}

export default function IncidentSupportButton({ apiUrl, token, incidentId }: Props) {
  const [count, setCount] = useState<number>(0);
  const [hasSupported, setHasSupported] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [toggling, setToggling] = useState<boolean>(false);

  const repository = new HttpIncidentRepository();
  const getSupportsUseCase = new GetIncidentSupportsUseCase(repository);
  const toggleSupportUseCase = new ToggleIncidentSupportUseCase(repository);

  useEffect(() => {
    setLoading(true);
    getSupportsUseCase
      .execute(apiUrl, token, incidentId)
      .then((stats) => {
        setCount(stats.count);
        setHasSupported(stats.hasSupported);
      })
      .catch((err) => {
        console.error('Error al cargar apoyos:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [apiUrl, token, incidentId]);

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);

    // Guardar estado previo para rollback en caso de error
    const prevCount = count;
    const prevHasSupported = hasSupported;

    // Optimistic Update
    setHasSupported(!prevHasSupported);
    setCount(prevHasSupported ? prevCount - 1 : prevCount + 1);

    try {
      const result = await toggleSupportUseCase.execute(apiUrl, token, incidentId);
      // Sincronizar con el resultado real
      setHasSupported(result.supported);
    } catch (err) {
      console.error('Error al alternar apoyo:', err);
      // Rollback
      setHasSupported(prevHasSupported);
      setCount(prevCount);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div class="h-11 px-4 inline-flex items-center justify-center border border-hairline rounded-lg bg-mist min-w-[70px]">
        <div class="animate-pulse w-4 h-4 bg-concrete rounded-full"></div>
      </div>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={toggling}
      class={`shrink-0 inline-flex items-center justify-center gap-1.5 text-xs font-semibold border rounded-lg px-3 sm:px-4 h-11 transition-colors cursor-pointer min-h-[44px] select-none ${
        hasSupported
          ? 'bg-graphite text-chalk border-graphite hover:bg-carbon hover:border-carbon'
          : 'bg-chalk text-graphite border-hairline hover:bg-mist'
      }`}
      aria-label={hasSupported ? 'Quitar mi apoyo a este reporte' : 'Apoyar este reporte'}
    >
      <svg
        class="w-4 h-4 transition-transform active:scale-95 duration-100"
        fill={hasSupported ? 'currentColor' : 'none'}
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span class="tabular-nums font-mono">{count}</span>
    </button>
  );
}
