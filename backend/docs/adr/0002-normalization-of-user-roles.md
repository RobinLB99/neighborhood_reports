# ADR 0002: Normalización de Roles de Usuario mediante Tabla e Identificadores

* **Título:** Normalización de Roles de Usuario mediante Tabla e Identificadores
* **Estado:** Aceptado
* **Contexto:** Inicialmente, el rol de un usuario se almacenaba como un texto plano (`varchar`) directamente en la tabla `usuarios`. Aunque esta aproximación simplificaba el desarrollo temprano, introduce el antipatrón de "obsesión por los tipos primitivos" (Primitive Obsession) a nivel de persistencia. Esto dificulta la integridad de datos, abre la posibilidad a errores ortográficos, complica el mantenimiento y limita la escalabilidad para implementar en el futuro una matriz de control de acceso basada en roles (RBAC) con permisos granulares.

---

## Decisión

Normalizar la estructura de datos abstrayendo los roles a una tabla dedicada y relacionando la tabla de usuarios mediante una clave foránea basada en enteros.

1. **Nueva Tabla `roles`:** Se introduce una tabla física `roles` que cuenta con un campo auto-incremental `id` y un campo `nombre` (`varchar` único y no nulo).
2. **Relación en `usuarios`:** Se reemplaza el campo `rol` (`varchar`) de la tabla `usuarios` por `rol_id` (`integer` no nulo) apuntando al `id` de la tabla `roles` con una restricción de eliminación `ON DELETE RESTRICT`.
3. **Mantenimiento del Dominio Agnóstico:** Para no acoplar las entidades de dominio ni los casos de uso a detalles de implementación de la base de datos (como IDs numéricos auto-incrementales), la entidad de dominio `User` sigue encapsulando el rol como un simple `string`. El repositorio de persistencia (`DrizzleAuthRepository`) se encarga de resolver la relación mediante un `LEFT JOIN` y mapear el nombre del rol a la entidad de dominio.
4. **Sembrado Idempotente (`seed.ts`):** Se añade un paso inicial en el script de sembrado automático para insertar los roles requeridos (`lider`, `miembro`, `ciudadano`) de manera condicional antes de poblar cualquier otra entidad que dependa de ellos.

---

## Consecuencias

### Positivas

* **Integridad Referencial:** La base de datos garantiza formalmente que ningún usuario sea asignado a un rol inexistente.
* **Extensibilidad (Futuro RBAC):** Agregar permisos, descripciones o relaciones adicionales por rol se puede hacer extendiendo la tabla `roles` sin tocar la tabla `usuarios`.
* **Centralización:** Los roles válidos del sistema están estrictamente normalizados y controlados en una única tabla, impidiendo la dispersión de strings arbitrarios.
* **Aislamiento del Dominio:** Los casos de uso (`LoginUseCase`, `GetProfileUseCase`) y la generación de JWTs no requieren cambios de firma puesto que la traducción de la llave foránea se realiza de manera encapsulada en la capa de infraestructura (Repositores).

### Negativas

* **Complejidad de Consulta:** Las lecturas de perfiles de usuario ahora requieren una operación `JOIN` en base de datos. Sin embargo, al estar indexadas por llave primaria en PostgreSQL, el impacto de rendimiento es despreciable.
* **Flujos de Escritura:** La creación de usuarios (ej. el registro del fundador del comité) requiere consultar primero el ID numérico del rol a partir de su nombre semántico.

---

## Referencias

* [Drizzle ORM Relational Queries Documentation](https://orm.drizzle.team/docs/joins)
* Relación de la tarea de normalización solicitada.
