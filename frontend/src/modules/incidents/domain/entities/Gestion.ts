export interface Gestion {
  id: number;
  reporteId: number;
  liderId: number;
  nombreLider?: string;
  estadoAsignado: 'pendiente' | 'en_gestion' | 'solucionado';
  mensaje: string;
  fechaGestion?: string;
}
