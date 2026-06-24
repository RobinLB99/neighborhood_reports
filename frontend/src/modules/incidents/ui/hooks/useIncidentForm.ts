import { useState } from 'preact/hooks';
import { z } from 'zod';
import { HttpIncidentRepository } from '../../infrastructure/HttpIncidentRepository';
import { CloudinaryStorageAdapter } from '../../infrastructure/CloudinaryStorageAdapter';
import { ReportIncidentUseCase } from '../../application/use-cases/ReportIncidentUseCase';

export const incidentFormSchema = z.object({
  direccion: z.string().min(5, { message: 'La dirección debe tener al menos 5 caracteres' }),
  ubicacion: z.string().regex(/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/, {
    message: 'La ubicación debe tener el formato estricto "latitud,longitud" (ej. -2.145, -79.888)'
  }),
  descripcion: z.string().min(10, { message: 'La descripción debe tener al menos 10 caracteres' }),
});

export type IncidentFormStatus = 'IDLE' | 'SIGNING' | 'UPLOADING' | 'SAVING' | 'SUCCESS' | 'ERROR';

interface UseIncidentFormProps {
  apiUrl: string;
  token: string;
  onSuccess?: () => void;
}

export function useIncidentForm({ apiUrl, token, onSuccess }: UseIncidentFormProps) {
  const [direccion, setDireccion] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  // Guardamos la URL subida de Cloudinary para soportar reintentos en caso de que falle el backend
  const [preUploadedFotoUrl, setPreUploadedFotoUrl] = useState<string | null>(null);

  const [status, setStatus] = useState<IncidentFormStatus>('IDLE');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const incidentRepo = new HttpIncidentRepository();
  const storageAdapter = new CloudinaryStorageAdapter();
  const reportUseCase = new ReportIncidentUseCase(incidentRepo, storageAdapter);

  async function submit() {
    setError(null);
    setFieldErrors({});

    // 1. Validación local del formulario
    const validationResult = incidentFormSchema.safeParse({
      direccion,
      ubicacion,
      descripcion,
    });

    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setFieldErrors(errors);
      setError('Por favor corrige los errores del formulario.');
      return;
    }

    if (!file && !preUploadedFotoUrl) {
      setError('Debes cargar una fotografía de la incidencia.');
      return;
    }

    try {
      // 2. Ejecutar Caso de Uso (maneja Pasos A, B y C recursivamente o directo si ya está pre-subido)
      const incident = await reportUseCase.execute(
        apiUrl,
        token,
        {
          direccion,
          ubicacion,
          descripcion,
          file: file || undefined,
          preUploadedFotoUrl: preUploadedFotoUrl || undefined,
        },
        (progressStep) => {
          setStatus(progressStep);
        }
      );

      // Si todo sale bien, guardar la URL final en el estado si deseamos, y actualizar a SUCCESS
      if (incident.fotoUrl) {
        setPreUploadedFotoUrl(incident.fotoUrl);
      }
      setStatus('SUCCESS');
      onSuccess?.();
    } catch (err: any) {
      setStatus('ERROR');
      setError(err.message || 'Error al reportar la incidencia. Intenta nuevamente.');
      
      // Si la imagen fue subida con éxito pero el backend falló, guardaremos la URL subida en el estado.
      // Analizamos si ya pasamos la fase de UPLOADING (es decir, ya estábamos en SAVING).
      // Si falló durante el paso 'SAVING', sabemos que la imagen se subió a Cloudinary correctamente.
      // Para saber esto, podemos buscar si la URL de Cloudinary ya se generó o si falló antes de eso.
      // El Caso de Uso arroja error. Si la subida fue exitosa, no tenemos la URL directa en el catch a menos que la guardemos.
      // Por ende, para que el rollback funcione a la perfección, podemos orquestar la llamada localmente en el hook
      // o dejar que el caso de uso avise al hook. 
      // Modifiquemos ligeramente para capturar la URL subida con éxito en el hook:
    }
  }

  // Versión de submit orquestada en el hook para soportar la retención de la URL de Cloudinary si el backend (Paso C) falla:
  async function submitOrquestado() {
    setError(null);
    setFieldErrors({});
    setStatus('IDLE');

    // Validación
    const validationResult = incidentFormSchema.safeParse({
      direccion,
      ubicacion,
      descripcion,
    });

    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setFieldErrors(errors);
      setError('Por favor corrige los errores del formulario.');
      return;
    }

    if (!file && !preUploadedFotoUrl) {
      setError('Debes cargar una fotografía de la incidencia.');
      return;
    }

    let currentFotoUrl = preUploadedFotoUrl;

    try {
      // Paso A & B: Subida a Cloudinary (si no se ha subido previamente)
      if (!currentFotoUrl && file) {
        setStatus('SIGNING');
        const signature = await storageAdapter.getSignature(apiUrl, token, 'reportes');

        setStatus('UPLOADING');
        const uploadResult = await storageAdapter.uploadImage(file, signature);
        
        // Aplicar optimización de entrega
        currentFotoUrl = uploadResult.secureUrl.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
        setPreUploadedFotoUrl(currentFotoUrl);
      }

      // Paso C: Registro en el Backend
      setStatus('SAVING');
      if (!currentFotoUrl) throw new Error('Error al procesar la imagen.');
      
      await incidentRepo.createIncident(apiUrl, token, {
        direccion,
        ubicacion,
        fotoUrl: currentFotoUrl,
        descripcion,
      });

      setStatus('SUCCESS');
      onSuccess?.();
    } catch (err: any) {
      setStatus('ERROR');
      setError(err.message || 'Ocurrió un error inesperado.');
    }
  }

  function reset() {
    setDireccion('');
    setDescripcion('');
    setUbicacion('');
    setFile(null);
    setPreUploadedFotoUrl(null);
    setStatus('IDLE');
    setError(null);
    setFieldErrors({});
  }

  return {
    direccion,
    setDireccion,
    descripcion,
    setDescripcion,
    ubicacion,
    setUbicacion,
    file,
    setFile,
    preUploadedFotoUrl,
    status,
    error,
    fieldErrors,
    submit: submitOrquestado,
    reset,
  };
}
