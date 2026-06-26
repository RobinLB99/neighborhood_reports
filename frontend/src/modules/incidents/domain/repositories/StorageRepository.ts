import type { StorageSignature } from '../entities/StorageSignature';

export interface StorageRepository {
  getSignature(apiUrl: string, token: string, folder?: string): Promise<StorageSignature>;
  uploadImage(
    file: File,
    signature: StorageSignature
  ): Promise<{ secureUrl: string }>;
}
