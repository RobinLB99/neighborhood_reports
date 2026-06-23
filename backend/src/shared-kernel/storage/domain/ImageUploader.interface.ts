import { StoredImage } from "./storage.js";

export interface ImageUploader {
    /**
     * Sube una imagen en formato Base64/Data URI a un servicio de almacenamiento.
     * @param base64Image String de la imagen cifrada.
     * @param folder Carpeta destino en el servicio (configurable por módulo).
     */
    upload(base64Image: string, folder: string): Promise<StoredImage>;
}
