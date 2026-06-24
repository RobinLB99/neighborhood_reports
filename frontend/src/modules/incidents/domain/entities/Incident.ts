export interface Incident {
  id: number;
  usuarioId: number;
  barrioId: number;
  direccion: string;
  ubicacion: string; // Formato "latitud,longitud"
  fotoUrl: string;
  estado: string;
  descripcion: string;
  fechaCreacion?: string;
}
