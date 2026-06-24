import { eq } from "drizzle-orm";
import { db } from "../../../shared-kernel/database/drizzle.js";
import { Province } from "../../domain/entities/Province.js";
import { City } from "../../domain/entities/City.js";
import { Neighborhood } from "../../domain/entities/Neighborhood.js";
import type { TerritoryRepository } from "../../domain/repositories/TerritoryRepository.interface.js";
import { provincias, ciudades, barrios } from "./schema.js";

/**
 * Adaptador de Infraestructura: DrizzleTerritoryRepository.
 * 
 * Implementación concreta del puerto TerritoryRepository utilizando Drizzle ORM.
 */
export class DrizzleTerritoryRepository implements TerritoryRepository {
  /**
   * Obtiene la lista completa de provincias ordenada por nombre.
   */
  async findAllProvinces(): Promise<Province[]> {
    const rows = await db
      .select()
      .from(provincias)
      .orderBy(provincias.nombre);

    return rows.map(
      (row) => new Province(row.id, row.nombre, row.fechaCreacion ?? undefined)
    );
  }

  /**
   * Obtiene la lista de ciudades de una provincia ordenada por nombre.
   */
  async findCitiesByProvinceId(provinceId: number): Promise<City[]> {
    const rows = await db
      .select()
      .from(ciudades)
      .where(eq(ciudades.provinciaId, provinceId))
      .orderBy(ciudades.nombre);

    return rows.map(
      (row) => new City(row.id, row.provinciaId, row.nombre, row.fechaCreacion ?? undefined)
    );
  }

  /**
   * Obtiene la lista de barrios de una ciudad ordenada por nombre.
   */
  async findNeighborhoodsByCityId(cityId: number): Promise<Neighborhood[]> {
    const rows = await db
      .select()
      .from(barrios)
      .where(eq(barrios.ciudadId, cityId))
      .orderBy(barrios.nombre);

    return rows.map(
      (row) => new Neighborhood(row.id, row.ciudadId, row.nombre, row.fechaCreacion ?? undefined)
    );
  }

  /**
   * Verifica si una provincia existe por su ID.
   */
  async provinceExists(provinceId: number): Promise<boolean> {
    const [row] = await db
      .select({ id: provincias.id })
      .from(provincias)
      .where(eq(provincias.id, provinceId))
      .limit(1);

    return !!row;
  }

  /**
   * Verifica si una ciudad existe por su ID.
   */
  async cityExists(cityId: number): Promise<boolean> {
    const [row] = await db
      .select({ id: ciudades.id })
      .from(ciudades)
      .where(eq(ciudades.id, cityId))
      .limit(1);

    return !!row;
  }
}
