import { db } from "./drizzle.js";
import { provincias, ciudades, barrios } from "../../territory/infrastructure/database/schema.js";
import { eq } from "drizzle-orm";

const BARRIOS_GUAYAQUIL = [
  "Las Peñas",
  "Cerro Santa Ana",
  "Cerro del Carmen",
  "Puerto Santa Ana",
  "Barrio del Astillero",
  "La Bahía",
  "Cinco Esquinas",
  "Barrio Garay",
  "Barrio Cuba",
  "Barrio Centenario Urdesa Central",
  "Lomas de Urdesa",
  "Urdesa Norte",
  "Miraflores",
  "El Paraíso",
  "La Ferroviaria",
  "Kennedy Vieja",
  "Kennedy Nueva",
  "Kennedy Norte",
  "San Antonio",
  "La Atarazana",
  "Ciudadela La FAE",
  "Ciudadela Simón Bolívar",
  "La Garzota (Etapas 1-4)",
  "Alborada (Etapas 1-14)",
  "Sauces (1-9)",
  "Guayacanes",
  "Samanes (1-7)",
  "Acuarela del Río",
  "Brisas del Río",
  "El Limonal",
  "Juan Pablo II",
  "Mucho Lote 1",
  "Mucho Lote 2",
  "Las Orquídeas",
  "Los Vergeles",
  "Los Geranios",
  "Metrópolis",
  "Villa España",
  "San Leonor",
  "Urbanor",
  "Las Cumbres",
  "Los Ceibos",
  "Ceibos Norte",
  "Santa Cecilia",
  "Los Olivos",
  "San Eduardo",
  "Colinas de los Ceibos",
  "Paraíso de los Ceibos",
  "Fontana",
  "San Felipe",
  "Bellavista Mapasingue Este",
  "Mapasingue Oeste",
  "Martha de Roldós",
  "Juan Montalvo",
  "El Maestro",
  "Gallegos Lara",
  "Eduardo Crespo Toral",
  "Prosperina",
  "Carlos Magno",
  "Bastión Popular (Bloques 1-11)",
  "Flor de Bastión",
  "El Fortín",
  "Nueva Prosperina",
  "Horizontes del Fortín",
  "Paraíso de la Flor",
  "San Francisco",
  "Lomas de la Florida",
  "Cooperativa 27 de Enero",
  "Balerio Estacio",
  "Sergio Toral",
  "Janeth Toral",
  "Monte Sinaí",
  "Thalía Toral",
  "Trinidad de Dios",
  "Voluntad de Dios",
  "Las Marías",
  "Ciudad Dios",
  "El Chorrillo",
  "Cordillera del Cóndor",
  "Realidad de Dios",
  "Tres de Diciembre",
  "Bastión de la Alborada La Saiba",
  "Las Acacias",
  "La Pradera",
  "Sopeña",
  "La Floresta (Etapas 1-4)",
  "Guasmo Norte",
  "Guasmo Central",
  "Guasmo Sur",
  "La Playita",
  "Santiago Roldós",
  "Unión de Bananeros",
  "Fertisa",
  "Coviem",
  "Los Esteros",
  "Jacobo Bucaram",
  "Santa Mónica",
  "Huancavilca",
  "Guangala",
  "Isla Trinitaria",
  "Trinipuerto",
  "Andrés Quiñónez",
  "Mudanza de Tierra",
  "6 de Noviembre",
  "El Recreo",
  "25 de Julio",
  "Puerto Liza",
  "La Chala",
  "Abel Gilbert",
  "Ciudadela El Cisne",
  "Batallón del Suburbio",
  "Dios, Patria y Libertad",
  "La Colmena",
  "Cuartel Cuatro",
  "Suburbio Oeste",
  "Cooperativa 5 de Diciembre",
  "Cooperativa 9 de Octubre (Sur)",
  "Las Malvinas",
  "La Fragata",
  "La Cartonera",
  "Cristo del Consuelo Chongón",
  "Puerto Azul",
  "Laguna Club",
  "Blue Coast",
  "Puerto Hondo",
  "Valle Alto",
  "Belo Horizonte",
  "Costalmar",
  "Terra Nostra",
  "Portofino",
  "Vía al Sol",
  "Torres del Salado",
  "Casas Viejas",
  "Pascuales Centro",
  "Asad Bucaram",
  "San Francisco de Pascuales",
  "Paquisha",
  "Puente Lucía"
];

async function main() {
  console.log("🚀 Iniciando el sembrado automático de datos territoriales...");

  try {
    // 1. Insertar o recuperar Provincia (Guayas)
    let provId: number;
    const [existingProv] = await db
      .select()
      .from(provincias)
      .where(eq(provincias.nombre, "Guayas"))
      .limit(1);

    if (existingProv) {
      provId = existingProv.id;
      console.log(`ℹ️ Provincia 'Guayas' ya existe (ID: ${provId})`);
    } else {
      const [newProv] = await db
        .insert(provincias)
        .values({ nombre: "Guayas" })
        .returning({ id: provincias.id });
      if (!newProv) {
        throw new Error("No se pudo registrar la provincia de Guayas.");
      }
      provId = newProv.id;
      console.log(`✅ Provincia 'Guayas' creada con ID: ${provId}`);
    }

    // 2. Insertar o recuperar Ciudad (Guayaquil)
    let ciuId: number;
    const [existingCiu] = await db
      .select()
      .from(ciudades)
      .where(eq(ciudades.nombre, "Guayaquil"))
      .limit(1);

    if (existingCiu) {
      ciuId = existingCiu.id;
      console.log(`ℹ️ Ciudad 'Guayaquil' ya existe (ID: ${ciuId})`);
    } else {
      const [newCiu] = await db
        .insert(ciudades)
        .values({ provinciaId: provId, nombre: "Guayaquil" })
        .returning({ id: ciudades.id });
      if (!newCiu) {
        throw new Error("No se pudo registrar la ciudad de Guayaquil.");
      }
      ciuId = newCiu.id;
      console.log(`✅ Ciudad 'Guayaquil' creada con ID: ${ciuId}`);
    }

    // 3. Obtener barrios ya existentes en Guayaquil para evitar duplicados (Idempotencia)
    const existingBarrios = await db
      .select({ nombre: barrios.nombre })
      .from(barrios)
      .where(eq(barrios.ciudadId, ciuId));

    const existingNames = new Set(existingBarrios.map((b) => b.nombre.toLowerCase()));

    // 4. Filtrar y preparar barrios nuevos
    const barriosToInsert = BARRIOS_GUAYAQUIL
      .filter((name) => !existingNames.has(name.toLowerCase()))
      .map((name) => ({
        ciudadId: ciuId,
        nombre: name,
      }));

    // 5. Inserción en lote (Bulk Insert)
    if (barriosToInsert.length > 0) {
      console.log(`⏳ Insertando ${barriosToInsert.length} barrios nuevos en Guayaquil...`);
      
      // Drizzle ORM soporta bulk insert nativo enviando un array de objetos
      await db.insert(barrios).values(barriosToInsert);
      
      console.log(`✅ Sembrado exitoso: ${barriosToInsert.length} barrios agregados.`);
    } else {
      console.log("ℹ️ Todos los barrios de Guayaquil ya se encuentran registrados en la base de datos.");
    }

    console.log("🎉 Proceso de sembrado completado satisfactoriamente.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error crítico durante el sembrado de base de datos:", error);
    process.exit(1);
  }
}

main();
