import type { IncidentRepository } from '../../domain/repositories/IncidentRepository';
import type { StorageRepository } from '../../domain/repositories/StorageRepository';
import type { Incident } from '../../domain/entities/Incident';

export class ReportIncidentUseCase {
  constructor(
    private readonly incidentRepository: IncidentRepository,
    private readonly storageRepository: StorageRepository
  ) {}

  async execute(
    apiUrl: string,
    token: string,
    data: {
      direccion: string;
      ubicacion: string;
      descripcion: string;
      file?: File;
      preUploadedFotoUrl?: string;
    },
    onProgress?: (step: 'SIGNING' | 'UPLOADING' | 'SAVING') => void
  ): Promise<Incident> {
    if (!token) throw new Error('Token de autenticación requerido');
    if (!data.direccion || data.direccion.length < 5) {
      throw new Error('La dirección debe tener al menos 5 caracteres');
    }
    if (!data.descripcion || data.descripcion.length < 10) {
      throw new Error('La descripción debe tener al menos 10 caracteres');
    }
    if (!data.ubicacion) {
      throw new Error('La ubicación es requerida');
    }

    let fotoUrl = data.preUploadedFotoUrl || '';

    // Si no tenemos URL pre-subida, realizamos el flujo de subida de imagen
    if (!fotoUrl) {
      if (!data.file) {
        throw new Error('El archivo de imagen es requerido para subir');
      }

      // Paso A: Obtener la firma de subida firmada
      onProgress?.('SIGNING');
      const signature = await this.storageRepository.getSignature(apiUrl, token, 'reportes');

      // Paso B: Subir directamente a Cloudinary mediante FormData
      onProgress?.('UPLOADING');
      const uploadResult = await this.storageRepository.uploadImage(data.file, signature);
      
      // Aplicar reglas de optimización de entrega de Cloudinary (f_auto, q_auto)
      fotoUrl = uploadResult.secureUrl.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
    }

    // Paso C: Crear la incidencia en el backend
    onProgress?.('SAVING');
    return this.incidentRepository.createIncident(apiUrl, token, {
      direccion: data.direccion,
      ubicacion: data.ubicacion,
      fotoUrl,
      descripcion: data.descripcion
    });
  }
}
