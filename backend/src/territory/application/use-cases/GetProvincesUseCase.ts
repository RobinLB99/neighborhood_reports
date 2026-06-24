import type { TerritoryRepository } from "../../domain/repositories/TerritoryRepository.interface.js";
import type { Province } from "../../domain/entities/Province.js";

/**
 * Caso de Uso: GetProvincesUseCase.
 * 
 * Se encarga de listar todas las provincias registradas en el sistema.
 */
export class GetProvincesUseCase {
  constructor(private readonly territoryRepository: TerritoryRepository) {}

  /**
   * Ejecuta la consulta para listar provincias.
   */
  async execute(): Promise<Province[]> {
    return await this.territoryRepository.findAllProvinces();
  }
}
