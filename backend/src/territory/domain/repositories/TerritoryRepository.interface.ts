import type { Province } from "../entities/Province.js";
import type { City } from "../entities/City.js";
import type { Neighborhood } from "../entities/Neighborhood.js";

/**
 * Puerto de Salida: TerritoryRepository.
 * 
 * Interfaz que define las operaciones de persistencia del catálogo geográfico.
 */
export interface TerritoryRepository {
  /**
   * Obtiene la lista completa de provincias.
   */
  findAllProvinces(): Promise<Province[]>;

  /**
   * Obtiene la lista de ciudades de una provincia.
   * 
   * @param provinceId ID único de la provincia.
   */
  findCitiesByProvinceId(provinceId: number): Promise<City[]>;

  /**
   * Obtiene la lista de barrios de una ciudad.
   * 
   * @param cityId ID único de la ciudad.
   */
  findNeighborhoodsByCityId(cityId: number): Promise<Neighborhood[]>;

  /**
   * Verifica si una provincia existe.
   */
  provinceExists(provinceId: number): Promise<boolean>;

  /**
   * Verifica si una ciudad existe.
   */
  cityExists(cityId: number): Promise<boolean>;
}
