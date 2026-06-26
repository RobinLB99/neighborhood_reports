import type { StorageRepository } from '../domain/repositories/StorageRepository';
import type { StorageSignature } from '../domain/entities/StorageSignature';

export class CloudinaryStorageAdapter implements StorageRepository {
  async getSignature(apiUrl: string, token: string, folder: string = 'reportes'): Promise<StorageSignature> {
    const res = await fetch(`${apiUrl}/api/storage/signature?folder=${folder}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Error al obtener la firma criptográfica para la subida.');
    }

    const json = await res.json();
    return json.data as StorageSignature;
  }

  async uploadImage(file: File, signature: StorageSignature): Promise<{ secureUrl: string }> {
    const url = `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signature.apiKey);
    formData.append('timestamp', signature.timestamp.toString());
    formData.append('signature', signature.signature);
    formData.append('folder', signature.folder);

    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(
        errJson.error?.message || 'Error al subir la imagen al servidor de almacenamiento en la nube.'
      );
    }

    const json = await res.json();
    return {
      secureUrl: json.secure_url,
    };
  }
}
