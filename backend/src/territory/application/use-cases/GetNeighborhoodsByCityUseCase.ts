import type { TerritoryRepository } from "../../domain/repositories/TerritoryRepository.interface.js";
import type { Neighborhood } from "../../domain/entities/Neighborhood.js";
import type { GetNeighborhoodsDto } from "../dtos/GetNeighborhoodsDto.js";
import { CityNotFoundError } from "../../../shared-kernel/errors/DomainErrors.js";

/**
 * Caso de Uso: GetNeighborhoodsByCityUseCase.
 * 
 * Se encarga de listar todos los barrios pertenecientes a una ciudad específica.
 */
export class GetNeighborhoodsByCityUseCase {
  constructor(private readonly territoryRepository: TerritoryRepository) {}

  /**
   * Ejecuta la consulta para listar barrios de una ciudad.
   * 
   * @param dto Contrato de entrada con el cityId.
   * @throws CityNotFoundError si la ciudad especificada no existe.
   */
  async execute(dto: GetNeighborhoodsDto): Promise<Neighborhood[]> {
    const cityExists = await this.territoryRepository.cityExists(dto.cityId);
    if (!cityExists) {
      throw new CityNotFoundError(dto.cityId);
    }

    return await this.territoryRepository.findNeighborhoodsByCityId(dto.cityId);
  }
}
