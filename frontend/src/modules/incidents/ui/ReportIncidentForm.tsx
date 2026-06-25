import { useState, useEffect, useRef } from 'preact/hooks';
import useAuth from '@modules/auth/application/useAuth';
import { useIncidentForm } from './hooks/useIncidentForm';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Reemplazar la obtención de iconos por URLs absolutas para evitar problemas con la resolución de rutas de recursos
// Se realiza de manera segura dentro de la inicialización del mapa en el cliente

interface Props {
  apiUrl: string;
}

export default function ReportIncidentForm({ apiUrl }: Props) {
  const { user, loading: authLoading, logout } = useAuth({ apiUrl, requireAuth: true });
  const [token, setToken] = useState<string>('');
  
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    direccion,
    setDireccion,
    descripcion,
    setDescripcion,
    ubicacion,
    setUbicacion,
    file,
    setFile,
    preUploadedFotoUrl,
    status,
    error,
    fieldErrors,
    submit,
    reset,
  } = useIncidentForm({
    apiUrl,
    token,
    onSuccess: () => {
      setImagePreview(null);
    }
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Inicializar mapa en useEffect
  useEffect(() => {
    // Si aún está cargando o no hay usuario, el div del mapa no existe en el DOM
    if (authLoading || !user) return;
    if (!mapRef.current || mapInstanceRef.current) return;

    // Configurar iconos de Leaflet de forma segura en el cliente (evita crash en server-side evaluation)
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    // Ubicación predeterminada: Guayaquil, Ecuador (-2.145, -79.888)
    const initialLat = -2.145;
    const initialLng = -79.888;

    const map = L.map(mapRef.current).setView([initialLat, initialLng], 13);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      updateMarker(lat, lng);
    });

    // Asegurar que el mapa calcule bien su tamaño
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [authLoading, user]);

  // Función para ubicar/mover el marcador
  function updateMarker(lat: number, lng: number) {
    const formattedCoord = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    setUbicacion(formattedCoord);

    if (mapInstanceRef.current) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], { draggable: true }).addTo(mapInstanceRef.current);
        marker.on('dragend', () => {
          const position = marker.getLatLng();
          const newFormatted = `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
          setUbicacion(newFormatted);
        });
        markerRef.current = marker;
      }
      mapInstanceRef.current.panTo([lat, lng]);
    }
  }

  // Usar geolocalización nativa del navegador
  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      alert('La geolocalización no es soportada por tu navegador.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateMarker(latitude, longitude);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 15);
        }
      },
      () => {
        alert('No se pudo obtener tu ubicación actual.');
      }
    );
  }

  function handleFileChange(e: Event) {
    const target = e.currentTarget as HTMLInputElement;
    if (target.files && target.files[0]) {
      const selectedFile = target.files[0];
      setFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
    }
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    await submit();
  }

  function handleReset() {
    reset();
    setImagePreview(null);
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
      mapInstanceRef.current.setView([-2.145, -79.888], 13);
    }
  }

  if (authLoading) {
    return (
      <div class="min-h-screen bg-chalk flex items-center justify-center">
        <p class="text-sm text-concrete">Cargando perfil...</p>
      </div>
    );
  }

  if (!user) return null;

  const isSubmitting = status === 'SIGNING' || status === 'UPLOADING' || status === 'SAVING';

  return (
    <div class="min-h-screen bg-chalk">
      <header class="border-b border-hairline bg-chalk">
        <div class="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <a href="/dashboard" class="text-sm font-semibold text-graphite hover:underline">
              Reportes Barriales
            </a>
            <span class="text-hairline">|</span>
            <span class="text-xs text-concrete">Reportar Incidencia</span>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-xs text-concrete capitalize">
              {user.nombre} ({user.rol})
            </span>
            <button
              onClick={logout}
              class="text-sm text-concrete hover:text-graphite transition-colors cursor-pointer select-none"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main class="max-w-5xl mx-auto px-6 py-12">
        <div class="mb-10 flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <a
              href="/dashboard"
              class="text-xs font-medium text-concrete hover:text-graphite transition-colors flex items-center gap-1"
            >
              ← Dashboard
            </a>
          </div>
          <h1 class="text-3xl font-semibold text-graphite">Registrar nueva incidencia</h1>
          <p class="text-sm text-concrete">
            Reporta desperfectos, peligros o novedades en tu barrio. La foto y la ubicación serán procesadas de manera segura.
          </p>
        </div>

        <div class="max-w-2xl mx-auto">
          <div class="bg-chalk border border-hairline rounded-xl p-6">
            {status === 'SUCCESS' ? (
              <div class="text-center py-8">
                <div class="w-12 h-12 rounded-full border border-hairline bg-mist flex items-center justify-center mx-auto mb-4">
                  <svg class="w-6 h-6 text-graphite" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 class="text-lg font-semibold text-graphite mb-2">Reporte Creado Exitosamente</h2>
                <p class="text-sm text-concrete mb-6">
                  El reporte de incidencia ha sido registrado en el backend de tu barrio.
                </p>
                <div class="flex gap-3 justify-center">
                  <button
                    onClick={handleReset}
                    class="bg-graphite text-chalk text-sm font-medium rounded-lg px-6 py-2.5 hover:bg-carbon cursor-pointer"
                  >
                    Crear otro reporte
                  </button>
                  <a
                    href="/dashboard"
                    class="inline-block border border-hairline text-graphite text-sm font-medium rounded-lg px-6 py-2.5 hover:bg-mist transition-colors"
                  >
                    Volver al dashboard
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} class="flex flex-col gap-5">
                {error && (
                  <div class="text-sm text-graphite bg-mist border border-hairline rounded-lg px-3 py-2.5">
                    <span class="font-medium">Error:</span> {error}
                    {preUploadedFotoUrl && (
                      <p class="text-xs text-concrete mt-1">
                        Nota: La fotografía ya se subió con éxito a la nube. Si haces clic en "Reintentar registro" no se volverá a subir.
                      </p>
                    )}
                  </div>
                )}

                {/* Dirección */}
                <div class="flex flex-col gap-1.5">
                  <label for="incident-address" class="text-sm font-medium text-graphite">
                    Dirección exacta del incidente
                  </label>
                  <input
                    id="incident-address"
                    type="text"
                    value={direccion}
                    onInput={(e) => setDireccion(e.currentTarget.value)}
                    placeholder="Ej: Av. Francisco de Orellana y Calle 10"
                    disabled={isSubmitting}
                    required
                    class="bg-chalk border border-hairline rounded-lg px-3 py-3 text-sm text-graphite focus:outline-none focus:border-graphite transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full"
                  />
                  {fieldErrors.direccion && (
                    <span class="text-xs text-graphite font-medium">{fieldErrors.direccion}</span>
                  )}
                </div>

                {/* Descripción */}
                <div class="flex flex-col gap-1.5">
                  <label for="incident-desc" class="text-sm font-medium text-graphite">
                    Descripción del problema
                  </label>
                  <textarea
                    id="incident-desc"
                    value={descripcion}
                    onInput={(e) => setDescripcion(e.currentTarget.value)}
                    placeholder="Describe brevemente el desperfecto, peligro o novedad detectada..."
                    rows={3}
                    disabled={isSubmitting}
                    required
                    class="bg-chalk border border-hairline rounded-lg px-3 py-3 text-sm text-graphite focus:outline-none focus:border-graphite transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full resize-none"
                  />
                  {fieldErrors.descripcion && (
                    <span class="text-xs text-graphite font-medium">{fieldErrors.descripcion}</span>
                  )}
                </div>

                {/* Selector de Ubicación con Mapa */}
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between">
                    <label class="text-sm font-medium text-graphite">Ubicación geográfica</label>
                    <button
                      type="button"
                      onClick={handleUseMyLocation}
                      disabled={isSubmitting}
                      class="text-xs text-graphite font-medium bg-mist border border-hairline rounded-lg px-2.5 py-1.5 hover:bg-hairline transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Usar mi ubicación
                    </button>
                  </div>
                  
                  <div class="relative">
                    {/* Contenedor del Mapa */}
                    <div 
                      ref={mapRef} 
                      class="h-[260px] w-full border border-hairline rounded-lg bg-mist z-0"
                    />
                  </div>

                  {/* Coordenadas en formato de texto */}
                  <input
                    type="text"
                    readOnly
                    value={ubicacion}
                    placeholder="Selecciona un punto en el mapa para marcar las coordenadas"
                    required
                    class="bg-mist border border-hairline rounded-lg px-3 py-2 text-xs text-concrete w-full cursor-not-allowed font-mono"
                  />
                  {fieldErrors.ubicacion && (
                    <span class="text-xs text-graphite font-medium">{fieldErrors.ubicacion}</span>
                  )}
                </div>

                {/* Carga de Imagen con Previsualización */}
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-medium text-graphite">Evidencia fotográfica</label>
                  
                  <div class="flex items-center gap-4">
                    {/* Botón de carga personalizado (Touch target de mínimo 44px) */}
                    <label 
                      class={`flex-1 border border-dashed border-smoke hover:border-graphite rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors min-h-[46px] px-4 text-sm text-graphite ${
                        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <svg class="w-5 h-5 text-concrete" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{file ? 'Cambiar fotografía' : 'Seleccionar foto'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={isSubmitting || !!preUploadedFotoUrl}
                        class="hidden"
                      />
                    </label>

                    {/* Previsualización instantánea */}
                    {imagePreview && (
                      <div class="w-16 h-16 border border-hairline rounded-lg overflow-hidden flex-shrink-0 bg-mist flex items-center justify-center">
                        <img src={imagePreview} alt="Vista previa" class="object-cover w-full h-full" />
                      </div>
                    )}
                  </div>
                  {preUploadedFotoUrl && (
                    <span class="text-xs text-graphite font-medium">✓ Imagen subida con éxito</span>
                  )}
                </div>

                {/* Botón de envío principal */}
                <button
                  type="submit"
                  disabled={isSubmitting || (!ubicacion || (!file && !preUploadedFotoUrl))}
                  class="bg-graphite text-chalk text-sm font-medium rounded-lg px-4 py-3.5 hover:bg-carbon disabled:opacity-50 transition-colors mt-4 cursor-pointer disabled:cursor-not-allowed w-full flex items-center justify-center gap-2"
                >
                  {status === 'SIGNING' && (
                    <>
                      <span class="animate-pulse">Obteniendo firma de subida...</span>
                    </>
                  )}
                  {status === 'UPLOADING' && (
                    <>
                      <span class="animate-pulse">Subiendo imagen a la nube...</span>
                    </>
                  )}
                  {status === 'SAVING' && (
                    <>
                      <span class="animate-pulse">Guardando reporte barrial...</span>
                    </>
                  )}
                  {status === 'IDLE' && 'Enviar Reporte'}
                  {status === 'ERROR' && (preUploadedFotoUrl ? 'Reintentar registro' : 'Reintentar subida')}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
