import type { Incident } from '../entities/Incident';

export interface IncidentRepository {
  createIncident(
    apiUrl: string,
    token: string,
    incident: Omit<Incident, 'id' | 'usuarioId' | 'barrioId' | 'estado' | 'fechaCreacion' | 'fechaActualizacion'>
  ): Promise<Incident>;

  getActiveIncidents(apiUrl: string, token: string): Promise<Incident[]>;
}
