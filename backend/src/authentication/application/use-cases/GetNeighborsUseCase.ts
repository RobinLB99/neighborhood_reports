import type { AuthRepository } from "../../domain/repositories/AuthRepository.interface.js";
import type { NeighborDto } from "../dtos/GetNeighborsDto.js";

/**
 * Caso de Uso: GetNeighborsUseCase.
 * 
 * Permite a un líder o miembro del comité obtener la lista de vecinos (ciudadanos)
 * de su mismo barrio que son elegibles para asignación u otras operaciones.
 */
export class GetNeighborsUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  /**
   * Obtiene la lista de vecinos elegibles por el ID del barrio.
   * 
   * @param barrioId Identificador del barrio.
   * @returns Promesa con la lista de vecinos adaptada al DTO.
   */
  async execute(barrioId: number): Promise<NeighborDto[]> {
    const neighbors = await this.authRepository.findEligibleNeighborsByBarrio(barrioId);
    
    return neighbors.map((neighbor) => ({
      id: neighbor.id!,
      nombre: neighbor.nombre,
      usuario: neighbor.usuario,
      fechaRegistro: neighbor.fechaRegistro?.toISOString(),
    }));
  }
}
