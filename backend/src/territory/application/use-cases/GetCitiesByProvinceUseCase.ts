import type { TerritoryRepository } from "../../domain/repositories/TerritoryRepository.interface.js";
import type { City } from "../../domain/entities/City.js";
import type { GetCitiesDto } from "../dtos/GetCitiesDto.js";
import { ProvinceNotFoundError } from "../../../shared-kernel/errors/DomainErrors.js";

/**
 * Caso de Uso: GetCitiesByProvinceUseCase.
 * 
 * Se encarga de listar todas las ciudades pertenecientes a una provincia específica.
 */
export class GetCitiesByProvinceUseCase {
  constructor(private readonly territoryRepository: TerritoryRepository) {}

  /**
   * Ejecuta la consulta para listar ciudades de una provincia.
   * 
   * @param dto Contrato de entrada con el provinceId.
   * @throws ProvinceNotFoundError si la provincia especificada no existe.
   */
  async execute(dto: GetCitiesDto): Promise<City[]> {
    const provinceExists = await this.territoryRepository.provinceExists(dto.provinceId);
    if (!provinceExists) {
      throw new ProvinceNotFoundError(dto.provinceId);
    }

    return await this.territoryRepository.findCitiesByProvinceId(dto.provinceId);
  }
}
