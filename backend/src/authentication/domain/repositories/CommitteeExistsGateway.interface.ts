/**
 * Puerto de salida (Outbound Port) para verificar la existencia de un comité barrial.
 * Mantiene desacoplado el dominio de autenticación del dominio de comités.
 */
export interface CommitteeExistsGateway {
  /**
   * Verifica si existe al menos un comité registrado en el barrio dado.
   * 
   * @param barrioId Identificador único del barrio.
   * @returns true si el comité existe, false de lo contrario.
   */
  existsInBarrio(barrioId: number): Promise<boolean>;
}
