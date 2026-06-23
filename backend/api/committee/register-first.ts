import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../../src/shared-kernel/http/cors.js';
import { RegisterFirstMemberSchema } from '../../src/committee/application/dtos/RegisterFirstMemberDto.js';
import { DrizzleCommitteeRepository } from '../../src/committee/infrastructure/database/DrizzleCommitteeRepository.js';
import { RegisterFirstMemberUseCase } from '../../src/committee/application/use-cases/RegisterFirstMember.js';
import {
  CommitteeAlreadyExistsError,
  UsernameAlreadyTakenError,
  BarrioNotFoundError,
} from '../../src/shared-kernel/errors/DomainErrors.js';

/**
 * Handler HTTP POST /api/committee/register-first (Driving Adapter).
 * 
 * Permite fundar un comité barrial y registrar al primer miembro administrador (Presidente).
 * 
 * Flujo:
 * 1. Resuelve políticas CORS.
 * 2. Valida la estructura y tipos del body de la petición mediante `RegisterFirstMemberSchema`.
 * 3. Inyecta manualmente `DrizzleCommitteeRepository` en `RegisterFirstMemberUseCase`.
 * 4. Ejecuta la lógica transaccional de negocio para crear el comité y vincular el usuario fundador.
 * 5. Gestiona las excepciones del negocio (conflictos de duplicidad, barrios inexistentes).
 * 
 * @param request Petición entrante del cliente con los datos de fundación del comité.
 * @param response Respuesta HTTP de éxito o error emitida.
 */
export default async function handler(request: VercelRequest, response: VercelResponse) {
  // 1. Aplicar políticas CORS
  if (handleCors(request, response)) {
    return;
  }

  // Restringir a POST
  if (request.method !== 'POST') {
    return response.status(405).json({
      error: 'Method Not Allowed',
      message: 'Este endpoint solo admite peticiones POST.',
    });
  }

  try {
    // 2. Validación estricta del contrato de entrada mediante Zod
    const result = RegisterFirstMemberSchema.safeParse(request.body);

    if (!result.success) {
      console.warn('[Validation Error] Fallo al validar cuerpo de la petición:', result.error.issues);
      return response.status(400).json({
        error: 'Bad Request',
        message: 'El payload enviado no cumple con las validaciones requeridas.',
        details: result.error.issues.map(err => ({
          campo: err.path.join('.'),
          mensaje: err.message,
        })),
      });
    }

    // 3. Inyección Manual de Dependencias (Mitiga tiempos de Cold Start)
    const repository = new DrizzleCommitteeRepository();
    const useCase = new RegisterFirstMemberUseCase(repository);

    // 4. Ejecución del Caso de Uso
    const output = await useCase.execute(result.data);

    console.info(`[Success] Comité barrial fundado en barrio ${result.data.barrioId} por usuario ID ${output.usuarioId}`);

    return response.status(201).json({
      message: 'Comité barrial registrado exitosamente.',
      data: {
        comiteId: output.committeeId,
        usuarioId: output.usuarioId,
        miembroId: output.miembroId,
      },
    });
  } catch (error) {
    // 5. Manejo estructurado de errores y protección de stack traces
    if (error instanceof CommitteeAlreadyExistsError || error instanceof UsernameAlreadyTakenError) {
      console.warn(`[Domain Business Warning] ${error.message}`);
      return response.status(409).json({
        error: 'Conflict',
        message: error.message,
        code: error.code,
      });
    }

    if (error instanceof BarrioNotFoundError) {
      console.warn(`[Domain Business Warning] ${error.message}`);
      return response.status(404).json({
        error: 'Not Found',
        message: error.message,
        code: error.code,
      });
    }

    // Errores inesperados del servidor
    console.error('[Internal Server Error]', error);
    return response.status(500).json({
      error: 'Internal Server Error',
      message: 'Ha ocurrido un error inesperado en el servidor. Por favor, intente de nuevo más tarde.',
    });
  }
}
