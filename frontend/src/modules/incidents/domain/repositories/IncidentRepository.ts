import type { Incident } from '../entities/Incident';
import type { SupportStats, ToggleSupportResult } from '../entities/SupportStats';

export interface IncidentRepository {
  createIncident(
    apiUrl: string,
    token: string,
    incident: Omit<Incident, 'id' | 'usuarioId' | 'barrioId' | 'estado' | 'fechaCreacion' | 'fechaActualizacion'>
  ): Promise<Incident>;

  getActiveIncidents(apiUrl: string, token: string): Promise<Incident[]>;

  getIncidentSupports(apiUrl: string, token: string, incidentId: number): Promise<SupportStats>;
  toggleIncidentSupport(apiUrl: string, token: string, incidentId: number): Promise<ToggleSupportResult>;
}

