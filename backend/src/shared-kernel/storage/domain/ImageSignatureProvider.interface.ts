/**
 * Estructura de datos devuelta al generar una firma para Cloudinary.
 */
export interface ImageSignature {
    readonly signature: string;
    readonly timestamp: number;
    readonly folder: string;
    readonly apiKey: string;
    readonly cloudName: string;
}

/**
 * Puerto para la provisión de firmas criptográficas para la subida de imágenes
 * directa desde el cliente al almacenamiento (Cloudinary).
 */
export interface ImageSignatureProvider {
    /**
     * Genera una firma criptográfica y proporciona las credenciales públicas
     * requeridas para que el cliente pueda realizar la subida de forma segura.
     * 
     * @param folder Carpeta destino dentro del almacenamiento.
     * @returns Datos de la firma y credenciales públicas.
     */
    generateSignature(folder: string): ImageSignature;
}
