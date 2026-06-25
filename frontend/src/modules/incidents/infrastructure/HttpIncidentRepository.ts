import type { IncidentRepository } from '../domain/repositories/IncidentRepository';
import type { Incident } from '../domain/entities/Incident';
import type { SupportStats, ToggleSupportResult } from '../domain/entities/SupportStats';
import type { Comment } from '../domain/entities/Comment';
import type { Gestion } from '../domain/entities/Gestion';
import { z } from 'zod';

const commentResponseSchema = z.object({
  id: z.number(),
  reporteId: z.number(),
  usuarioId: z.number(),
  mensaje: z.string(),
  fechaCreacion: z.string().optional(),
});

const gestionResponseSchema = z.object({
  id: z.number(),
  reporteId: z.number(),
  liderId: z.number(),
  nombreLider: z.string().optional(),
  estadoAsignado: z.enum(['pendiente', 'en_gestion', 'solucionado']),
  mensaje: z.string(),
  fechaGestion: z.string().optional(),
});

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

  async getIncidentSupports(apiUrl: string, token: string, incidentId: number): Promise<SupportStats> {
    const res = await fetch(`${apiUrl}/api/incidents/${incidentId}/supports`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Error al obtener los apoyos del reporte.');
    }

    const json = await res.json();
    return json.data as SupportStats;
  }

  async toggleIncidentSupport(apiUrl: string, token: string, incidentId: number): Promise<ToggleSupportResult> {
    const res = await fetch(`${apiUrl}/api/incidents/${incidentId}/supports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Error al modificar el apoyo del reporte.');
    }

    const json = await res.json();
    return json.data as ToggleSupportResult;
  }

  async addComment(apiUrl: string, token: string, incidentId: number, message: string): Promise<Comment> {
    const res = await fetch(`${apiUrl}/api/incidents/${incidentId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ mensaje: message }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Error al agregar el comentario.');
    }

    const json = await res.json();
    
    // Validamos la respuesta utilizando Zod según las reglas
    const parsed = commentResponseSchema.safeParse(json.data);
    if (!parsed.success) {
      throw new Error('La respuesta del servidor no tiene el formato esperado.');
    }

    return parsed.data;
  }

  async getComments(apiUrl: string, token: string, incidentId: number): Promise<Comment[]> {
    const res = await fetch(`${apiUrl}/api/incidents/${incidentId}/comments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Error al obtener los comentarios del reporte.');
    }

    const json = await res.json();
    const parsed = z.array(commentResponseSchema).safeParse(json.data);
    if (!parsed.success) {
      throw new Error('La respuesta del servidor no tiene el formato esperado.');
    }

    return parsed.data;
  }

  async getGestiones(apiUrl: string, token: string, incidentId: number): Promise<Gestion[]> {
    const res = await fetch(`${apiUrl}/api/incidents/${incidentId}/management`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Error al obtener el historial de gestiones.');
    }

    const json = await res.json();
    const parsed = z.array(gestionResponseSchema).safeParse(json.data);
    if (!parsed.success) {
      throw new Error('La respuesta del servidor no tiene el formato esperado para las gestiones.');
    }

    return parsed.data;
  }

  async createGestion(
    apiUrl: string,
    token: string,
    incidentId: number,
    estadoAsignado: 'pendiente' | 'en_gestion' | 'solucionado',
    mensaje: string
  ): Promise<Gestion> {
    const res = await fetch(`${apiUrl}/api/incidents/${incidentId}/management`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        estadoAsignado,
        mensaje,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Error al guardar la gestión directiva.');
    }

    const json = await res.json();
    const parsed = gestionResponseSchema.safeParse(json.data);
    if (!parsed.success) {
      throw new Error('La respuesta del servidor no tiene el formato esperado para la gestión registrada.');
    }

    return parsed.data;
  }
}

