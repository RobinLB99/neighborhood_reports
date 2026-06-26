import type { Incident } from '../entities/Incident';
import type { SupportStats, ToggleSupportResult } from '../entities/SupportStats';
import type { Comment } from '../entities/Comment';
import type { Gestion } from '../entities/Gestion';

export interface IncidentRepository {
  createIncident(
    apiUrl: string,
    token: string,
    incident: Omit<Incident, 'id' | 'usuarioId' | 'barrioId' | 'estado' | 'fechaCreacion' | 'fechaActualizacion'>
  ): Promise<Incident>;

  getIncidents(
    apiUrl: string,
    token: string,
    status?: string,
    limit?: number,
    cursor?: string
  ): Promise<{ incidents: Incident[]; nextCursor: string | null }>;

  getIncidentSupports(apiUrl: string, token: string, incidentId: number): Promise<SupportStats>;
  toggleIncidentSupport(apiUrl: string, token: string, incidentId: number): Promise<ToggleSupportResult>;

  addComment(apiUrl: string, token: string, incidentId: number, message: string): Promise<Comment>;
  getComments(apiUrl: string, token: string, incidentId: number): Promise<Comment[]>;

  getGestiones(apiUrl: string, token: string, incidentId: number): Promise<Gestion[]>;

  createGestion(
    apiUrl: string,
    token: string,
    incidentId: number,
    estadoAsignado: 'pendiente' | 'en_gestion' | 'solucionado',
    mensaje: string
  ): Promise<Gestion>;
}


