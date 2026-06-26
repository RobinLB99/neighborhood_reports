export interface Comment {
  id: number;
  reporteId: number;
  usuarioId: number;
  mensaje: string;
  fechaCreacion?: string;
}
