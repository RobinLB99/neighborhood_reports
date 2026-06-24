import type { IncidentRepository } from '../domain/repositories/IncidentRepository';
import type { Incident } from '../domain/entities/Incident';

export class HttpIncidentRepository implements IncidentRepository {
  async createIncident(
    apiUrl: string,
    token: string,
    incident: Omit<Incident, 'id' | 'usuarioId' | 'barrioId' | 'estado' | 'fechaCreacion' | 'fechaActualizacion'>
  ): Promise<Incident> {
    const res = await fetch(`${apiUrl}/api/incidents/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(incident),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Error al guardar el reporte en el servidor.');
    }

    const json = await res.json();
    return json.data as Incident;
  }

  async getActiveIncidents(apiUrl: string, token: string): Promise<Incident[]> {
    const res = await fetch(`${apiUrl}/api/incidents/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Error al obtener los reportes del servidor.');
    }

    const json = await res.json();
    return json.data as Incident[];
  }
}
