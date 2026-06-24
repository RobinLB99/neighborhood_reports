import { eq } from "drizzle-orm";
import { db } from "../../../shared-kernel/database/drizzle.js";
import { comites } from "../../../committee/infrastructure/database/schema.js";
import type { CommitteeExistsGateway } from "../../domain/repositories/CommitteeExistsGateway.interface.js";

/**
 * Adaptador de Infraestructura para verificar la existencia de comités.
 * Utiliza Drizzle ORM para realizar la consulta sobre la base de datos PostgreSQL.
 */
export class DrizzleCommitteeExistsGateway implements CommitteeExistsGateway {
  /**
   * Verifica la existencia de un comité registrado para un barrio específico.
   * 
   * @param barrioId Identificador único del barrio.
   * @returns true si existe un comité en ese barrio, false de lo contrario.
   */
  async existsInBarrio(barrioId: number): Promise<boolean> {
    const rows = await db
      .select({ id: comites.id })
      .from(comites)
      .where(eq(comites.barrioId, barrioId))
      .limit(1);

    return rows.length > 0;
  }
}
