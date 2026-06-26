# 🧠 Memoria del Proyecto (MEMORY.md)

Este archivo sirve para preservar el contexto de las decisiones técnicas y arquitectónicas entre sesiones. **DEBE actualizarse al final de cada sesión relevante.**

---

## 📅 Estado y Contexto General
*   **Fecha de Creación:** 20 de Junio, 2026
*   **Última Actualización:** 25 de Junio, 2026 (por Jarvis - Consolidación en Monolithic Serverless Router)
*   **Entorno Principal:** Node.js (Vercel Serverless Functions) con TypeScript
*   **Arquitectura:** Concentrada en capas concéntricas (Dominio, Aplicación, Infraestructura) siguiendo Hexagonal, Clean y Screaming Architecture (detallado en [architecture.md](file:///home/joel/Proyectos%20Full-Stack/reports/backend/architecture.md)).

---

## 🏛️ Decisiones de Arquitectura de Datos

### 1. Migración a `neon_local:v1.5` en Desarrollo Local
*   **Contexto:** El driver HTTP de Neon (`drizzle-orm/neon-http` y `@neondatabase/serverless`) no es compatible con el protocolo TCP estándar expuesto por PostgreSQL clásico local en Docker Compose.
*   **Decisión:** Se sustituyó PostgreSQL clásico por la imagen **`neondatabase/neon_local:v1.5`** en [docker-compose.yml](file:///home/joel/Proyectos%20Full-Stack/reports/backend/docker-compose.yml).
*   **Implementación:**
    *   En [drizzle.ts](file:///home/joel/Proyectos%20Full-Stack/reports/backend/src/shared-kernel/database/drizzle.ts) se añadió una redirección dinámica de `neonConfig.fetchEndpoint` hacia `http://localhost:5432/sql` y se deshabilitó `useSecureWebSocket` únicamente cuando `NODE_ENV === "development"`.
    *   Se agregaron las variables `NEON_API_KEY`, `NEON_PROJECT_ID` y `PARENT_BRANCH_ID` en [.env.example](file:///home/joel/Proyectos%20Full-Stack/reports/backend/.env.example).
*   **Consecuencias:**
    *   **Positivas:** Paridad del 100% de la lógica y el driver de base de datos entre desarrollo y producción. Soporte nativo para ramificaciones efímeras en local.
    *   **Negativas:** El desarrollo local ahora requiere conexión a internet y credenciales válidas de Neon Cloud para levantar la base de datos de Docker.

### 2. Refactorización de Roles de Usuario a PostgreSQL ENUM
*   **Contexto:** Se utilizaba una tabla `roles` vinculada por `rol_id` en `usuarios`. Esto aumentaba la complejidad de las consultas (JOINs extras en logins y validaciones de comités) y del sembrado para tres roles estáticos (`lider`, `miembro`, `ciudadano`).
*   **Decisión:** Eliminar la tabla `roles` y la clave foránea en favor de un tipo nativo PostgreSQL `pgEnum("user_role")` asignado a la columna `rol` en `usuarios`.
*   **Implementación:**
    *   Definición de `userRoleEnum = pgEnum("user_role", ["lider", "miembro", "ciudadano"])` en `src/authentication/infrastructure/database/schema.ts`.
    *   Refactorización de `DrizzleAuthRepository.ts` y `DrizzleCommitteeRepository.ts` eliminando los `leftJoin` redundantes con la tabla `roles`.
    *   Modificación manual de la migración `0003_tough_doctor_octopus.sql` para evitar el colapso que producía la combinación de `CASCADE` y la posterior eliminación manual de constraints.
*   **Consecuencias:**
    *   **Positivas:** Simplificación del modelo de datos de usuario, reducción de JOINs en consultas frecuentes y eliminación de siembras innecesarias en `seed.ts`. El frontend quedó inmune al cambio debido a que el contrato API (DTO) no se modificó.
    *   **Negativas:** Requiere auditoría manual de las migraciones complejas de Drizzle Kit para evitar que el ORM intente ejecutar caídas de constraints secuenciales conflictivas tras cláusulas `CASCADE`.

---

## 🏛️ Decisiones de Diseño y Dominio

### 1. Desacoplamiento de Registro de Usuario y Fundación de Comité (ADR 0003 - Superado por ADR 0004)
*   **Contexto:** La creación del líder (usuario) estaba acoplada a la fundación del comité, violando SRP y dificultando la creación independiente de otros roles.
*   **Decisión:** Separar la lógica creando `RegisterUserUseCase` en `authentication` (`POST /api/auth/register`) para ciudadanos normales. La fundación del comité requería autenticación JWT previa.
*   **Estado:** *Superado* por el ADR 0004 para eliminar la fricción del onboarding.

### 2. Alta Pública y Atómica del Líder Fundador y Comité Barrial (ADR 0004)
*   **Contexto:** El flujo en dos pasos del ADR 0003 generaba demasiada fricción para los líderes del comité. Se requería que el registro del comité y de su líder fundador fuese público (sin token), pero de manera segura y atómica para evitar comités huérfanos o suplantaciones.
*   **Decisión:** Implementar un endpoint de registro unificado `/api/auth/register-leader` liberado en el middleware de Vercel. El controlador delega en `RegisterCommitteeUseCase` (dentro de `src/committee`), el cual ejecuta una única transacción de base de datos (`db.transaction`) que:
    1. Registra al usuario en la tabla `usuarios` (con la contraseña hasheada y asignándole directamente el rol `lider`).
    2. Registra el comité en la tabla `comites` para el `barrioId` (garantizando un solo comité por barrio).
    3. Asigna la membresía directiva en `miembros_comite` con el rol de "Presidente".
*   **Consecuencias:**
    *   **Positivas:** Registro en un solo paso libre de tokens JWT para los líderes. Transaccionalidad al 100% (consistencia dura). Coherencia en la API al ubicar todos los registros públicos bajo el prefijo `/api/auth/*`.
    *   **Negativas:** Introduce una dependencia directa del dominio `src/committee` hacia las entidades de usuario (`User`) y el helper de hash del kernel.

### 3. Restricción de Registro de Ciudadanos sin Comité Barrial Activo
*   **Contexto:** Un ciudadano normal no debe poder registrarse en un barrio si no existe previamente al menos un miembro del comité registrado allí (presidente, etc.). Esto evita la proliferación de ciudadanos en barrios "fantasmas" o sin representación oficial.
*   **Decisión:** Implementar la validación en el caso de uso `RegisterUserUseCase` a través del puerto `CommitteeExistsGateway` (Alternativa 1 de desacoplamiento). La infraestructura implementa este puerto a través de `DrizzleCommitteeExistsGateway`, consultando si hay algún registro en la tabla `comites` para el `barrioId` indicado.
*   **Consecuencias:**
    *   **Positivas:** Desacoplamiento total entre el dominio de autenticación (`authentication`) y el de comités (`committee`). El endpoint devuelve un código HTTP `403 Forbidden` con error estructurado si la validación falla.
    *   **Negativas:** Ninguna.

### 4. Implementación del Flujo de Creación de Reportes Ciudadanos e Incidencias (Signed Uploads)
*   **Contexto:** El backend necesita permitir a cualquier ciudadano reportar incidencias locales adjuntando evidencias fotográficas pesadas. Procesar imágenes directamente en las funciones serverless de Vercel está sujeto a límites estrictos de payload (4.5MB en Vercel) y degrada el rendimiento de arranque frío (Cold Starts) debido al parsing binario.
*   **Decisión:** 
    *   **Subidas Firmadas (Signed Uploads) - Opción B:** Implementar un endpoint transversal `/api/storage/signature` que provee firmas criptográficas HMAC-SHA1 generadas de forma segura en el backend (`CloudinaryImageUploader`) usando la API key privada. Esto faculta al frontend a subir las imágenes directamente a Cloudinary saltándose el límite de Vercel.
    *   **Validación de Ubicación por Regex:** Validar las coordenadas enviadas mediante Zod Regex (`/^-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?$/`) para forzar un formato estricto `"latitud,longitud"` (ej. `"-2.145, -79.888"`) antes de persistir en PostgreSQL.
    *   **Desacoplamiento Puro:** Encapsular la creación de incidencias en `CreateReportUseCase` inyectando manualmente el puerto `IncidentRepository` (implementado por `DrizzleIncidentRepository`).
*   **Consecuencias:**
    *   **Positivas:** Inmunidad ante límites físicos de payload en Vercel. Rápido procesamiento e inserción de datos limpios. Cero dependencias de infraestructura en el caso de uso.
    *   **Negativas:** Aumenta la complejidad en el cliente, el cual ahora debe orquestar el flujo en tres pasos: obtener firma, subir a Cloudinary, y enviar el payload con la URL final al endpoint de creación de reportes.

---

## 🛡️ Decisiones de Seguridad

### 1. Implementación de Vercel Edge Middleware Global (`middleware.ts`)
*   **Contexto:** Necesitamos un mecanismo global de seguridad rápido para bloquear peticiones con tokens inválidos o expirados antes de que alcancen las funciones serverless de Node.js.
*   **Decisión:** Se implementó la Alternativa 1 (Vercel Edge Middleware) en la raíz del proyecto.
*   **Implementación:**
    *   Valida firmas JWT en el Edge runtime usando la biblioteca ligera `jose`.
    *   Mantiene una lista blanca de rutas públicas (`PUBLIC_PATHS`) en `middleware.ts`.
    *   Inyecta el contexto de identidad verificado en las cabeceras HTTP (`x-user-id`, `x-user-role`, `x-user-barrio-id`).
    *   Se creó el helper `getAuthenticatedUser(request)` en `src/shared-kernel/http/auth.ts` para facilitar su extracción segura y tipada en las funciones de la capa de entrada.
*   **Consecuencias:**
    *   **Positivas:** Detiene peticiones no autorizadas en la frontera de la red global de Vercel sin consumir cómputo de backend (mitiga cold starts e innecesarias conexiones a BD).
    *   **Negativas:** Obliga a gestionar las excepciones de rutas públicas de forma centralizada en `middleware.ts`. Si se agrega un endpoint protegido pero se olvida declararlo en el middleware, el helper lanzará error 500 debido a cabeceras faltantes.

### 2. Documentación Inline mediante Estándar TSDoc/JSDoc
*   **Contexto:** Los desarrolladores y sistemas automatizados requieren comprender con rapidez las responsabilidades arquitectónicas, contratos de entrada/salida y posibles excepciones sin tener que leer toda la lógica imperativa.
*   **Decisión:** Se documentó en código fuente los componentes clave (Middlewares, Driving Adapters, Use Cases y Domain Entities) utilizando comentarios en bloque JSDoc/TSDoc estructurados.
*   **Implementación:**
    *   Se especificaron flujos lógicos, parámetros `@param`, tipos de retorno `@returns` y excepciones lanzadas `@throws` en todos los archivos del núcleo y límites del backend.
*   **Consecuencias:**
    *   **Positivas:** Mejora la mantenibilidad, facilita el onboarding de nuevos colaboradores y habilita la autogeneración automática de documentación de APIs y componentes del sistema.
    *   **Negativas:** Incremento marginal en el tamaño de las líneas de código, aunque irrelevante para el empaquetado final tras la transpilación a JavaScript.

### 3. Generación Automatizada del Contrato OpenAPI (`scripts/generate-openapi.ts`)
*   **Contexto:** Se requiere mantener sincronizado el contrato OpenAPI con los schemas de validación Zod existentes en el backend para que el frontend pueda auto-generar tipos y clientes de forma automatizada y sin acoplamiento directo.
*   **Decisión:** Implementar un compilador de especificación dinámico utilizando `@asteasolutions/zod-to-openapi` e instanciar un registro central en `shared-kernel`.
*   **Implementación:**
    *   Se creó [registry.ts](file:///home/joel/Proyectos%20Full-Stack/reports/backend/src/shared-kernel/openapi/registry.ts) centralizando la extensión de Zod y la matriculación de esquemas y rutas.
    *   Se desarrolló [generate-openapi.ts](file:///home/joel/Proyectos%20Full-Stack/reports/backend/scripts/generate-openapi.ts) para generar el archivo `openapi.json` resolviendo rutas absolutas de forma segura en base al directorio del comando.
*   **Consecuencias:**
    *   **Positivas:** Contrato OpenAPI autogenerado y siempre fiel a las reglas de validación en tiempo de ejecución. El frontend puede tiparse de forma 100% independiente.
    *   **Negativas:** Añade una dependencia de desarrollo adicional (`@asteasolutions/zod-to-openapi`) y requiere registrar de forma explícita cada ruta y DTO nuevo en el `registry`.

### 4. Consulta Segura de Vecinos del Barrio (GET /api/users/neighbors)
*   **Contexto:** Los líderes del comité necesitan un listado de vecinos elegibles de su propio barrio para promoverlos a cargos directivos. El frontend no debe enviar el `barrioId` de manera explícita para evitar vulnerabilidades de escalación o fuga de datos (IDOR).
*   **Decisión:** Crear un endpoint protegido por el middleware JWT que extraiga dinámicamente el `barrioId` del contexto decodificado (`x-user-barrio-id`) y delegue en el caso de uso `GetNeighborsUseCase`. El acceso está restringido exclusivamente a roles `lider` y `miembro`.
*   **Consecuencias:**
    *   **Positivas:** Seguridad total en la consulta basada en el JWT (evita que un líder consulte vecinos de otro barrio alterando parámetros). Cumple con el principio de menor privilegio.
    *   **Negativas:** El usuario solicitante debe tener obligatoriamente un `barrioId` asignado y válido en su JWT, de lo contrario se rechaza con HTTP 400.

### 5. Consulta y Listado de Reportes Barriales Activos con Paginación Basada en Cursor (GET /api/incidents/list)
*   **Contexto:** Se requiere permitir a los usuarios autenticados (de cualquier rol) obtener un listado de reportes barriales activos. Traer todos los registros a la vez degrada el rendimiento de red y UI en el cliente a medida que crece el histórico de incidencias.
*   **Decisión:** El endpoint se restringe a métodos `GET`. Se extrae el `barrioId` de forma segura de las cabeceras inyectadas por el JWT en el middleware (`x-user-barrio-id`) mediante `getAuthenticatedUser(request)`. Adicionalmente, implementamos paginación basada en cursor (Alternativa B) utilizando la columna `fechaCreacion` del reporte como cursor y un límite predeterminado de 10 elementos por página para asegurar alta velocidad y evitar duplicaciones.
*   **Implementación:**
    *   **Backend:** Se extendió `listReportsByBarrio` (en `DrizzleIncidentRepository`) aplicando el operador `lt(reportes.fechaCreacion, cursorDate)` y limitando la consulta. El caso de uso `ListReportsUseCase` calcula el `nextCursor` basado en el último elemento si la cantidad recuperada coincide con el límite.
    *   **Documentación:** Se actualizó `registry.ts` registrando `nextCursor` en `ListReportsResponseSchema` y exponiendo los parámetros `limit` y `cursor` en la especificación OpenAPI.
*   **Consecuencias:**
    *   **Positivas:** Seguridad absoluta por diseño contra IDOR y alta optimización en el payload de datos y renderizado del DOM en dispositivos cliente.
    *   **Negativas:** Obliga a que el usuario posea un `barrioId` asociado en su JWT.

### 6. Implementación de Apoyos (Likes/Corazones) en Reportes (GET y POST /api/incidents/[id]/supports)
*   **Contexto:** Los usuarios del frontend requieren poder apoyar (dar me gusta / corazón) a incidencias específicas. Se necesita registrar este apoyo en base de datos y obtener estadísticas de manera segura e independiente.
*   **Decisión:** Crear una ruta dinámica única `/api/incidents/[id]/supports` administrando los dos verbos HTTP solicitados:
    *   `POST`: Realiza un "toggle" (alterna entre agregar y quitar apoyo) en base a la existencia previa del registro para el usuario autenticado y el ID del reporte.
    *   `GET`: Devuelve el conteo de apoyos en formato entero (`count`) y si el usuario actual ha apoyado la incidencia (`hasSupported`).
*   **Consecuencias:**
    *   **Positivas:** Reducción de la latencia y volumen de empaquetado para funciones serverless en Vercel al consolidar la lógica de apoyos en un único handler dinámico. Desacoplamiento de negocio en puertos/casos de uso separados (`ToggleIncidentSupportUseCase` y `GetIncidentSupportsUseCase`).
    *   **Negativas:** Ninguna.

### 7. Implementación de Gestión de Comentarios en Reportes (POST y GET /api/incidents/[id]/comments)
*   **Contexto:** Los usuarios requieren poder dejar comentarios en los reportes ciudadanos para aportar detalles o coordinar acciones, y los líderes y miembros del comité necesitan poder listar estos comentarios para el seguimiento.
*   **Decisión:** Crear y extender la lógica estructurada en base a Clean Architecture:
    *   **Dominio:** Entidad `Comentario` con validaciones puras y un esquema Zod (`CreateCommentPayloadSchema`) que limita el mensaje a un máximo de 500 caracteres.
    *   **Puerto:** Interfaz `IncidentCommentRepository` definiendo `addComment` y `getCommentsByReporte`.
    *   **Aplicación:**
        *   `AddCommentToIncidentUseCase` que comprueba si la incidencia existe (vía `IncidentRepository`) antes de delegar la persistencia del comentario (`POST`).
        *   `GetIncidentCommentsUseCase` que valida la existencia del reporte y recupera su listado de comentarios activos (`GET`).
    *   **Infraestructura:** Adaptador `DrizzleIncidentCommentRepository` mapeando las operaciones a la tabla preexistente `comentarios` mediante Drizzle ORM.
    *   **Adaptador Primario (Vercel Handler):** Handler dinámico en `/api/incidents/[id]/comments.ts` extendido para soportar `POST` y `GET`. En el flujo `GET`, se extrae el token del JWT y se restringe el acceso retornando `403 Forbidden` a cualquier usuario que no posea los roles `lider` o `miembro`.
    *   **Contrato e Integración OpenAPI:** Registro explícito en `registry.ts` de los esquemas (`CreateCommentResponseSchema`, `ListCommentsResponseSchema`) y de los endpoints `POST` y `GET` bajo `/api/incidents/{id}/comments` con autorización Bearer JWT. Esto actualiza de manera automatizada el contrato `openapi.json` para el frontend.
*   **Consecuencias:**
    *   **Positivas:** Seguridad por diseño (evita suplantación de `usuario_id` y limita la visibilidad a roles autorizados mediante checks de roles en el handler). Encapsulamiento del dominio con límites claros. Contratos OpenAPI sincronizados y documentados en código.
    *   **Negativas:** Ninguna.

---

## 🐳 Decisiones de Infraestructura y Contenedores

### 1. Servicio de Node.js en Docker Compose y Dockerfile Multi-stage con Origen Explícito
*   **Contexto:** Se requiere un entorno local reproducible para ejecutar y compilar el backend de TypeScript alineado con el proxy de base de datos de Neon local en contenedores, evitando dependencias locales en el sistema operativo del host.
*   **Decisión:** 
    *   Se creó un [Dockerfile](file:///home/joel/Proyectos%20Full-Stack/reports/backend/Dockerfile) utilizando construcción multi-stage con la imagen oficial de Docker Hub `docker.io/library/node:24-alpine3.24` tanto para construcción como para ejecución.
    *   Se habilitó `corepack` para manejar la instalación de dependencias reproducible mediante `pnpm` con su lockfile.
    *   Se incorporó el servicio `node` en [docker-compose.yml](file:///home/joel/Proyectos%20Full-Stack/reports/backend/docker-compose.yml), explicitando el dominio del registro `docker.io/` en todas las imágenes de los servicios (`node` y `postgres`) y aislando `node_modules` en volúmenes internos.
*   **Consecuencias:**
    *   **Positivas:** Paridad de entornos de ejecución de dependencias, compilación aislada con pnpm corepack, y declaración explícita de registros de imágenes (`docker.io`) para evitar ambigüedades.
    *   **Negativas:** Mayor tiempo de compilación inicial de la imagen en la máquina de desarrollo (mitigado con la caché de capas de Docker).

### 2. Consulta de Miembros de la Junta Directiva de un Comité (GET /api/committee/members/list)
*   **Contexto:** Los líderes y miembros de un comité necesitan listar de forma exclusiva a los miembros directivos de su junta (Presidente, Secretario, Vocal). Para mantener la eficiencia de las funciones serverless de Vercel y evitar bundles pesados, se rechazó la unificación en el archivo del POST (`api/committee/members.ts`).
*   **Decisión:** Crear un handler completamente aislado e independiente en `/api/committee/members/list.ts`. El acceso está estrictamente protegido y limitado a roles `lider` y `miembro`. La consulta relacional en la base de datos se realiza a través de un `innerJoin` entre `miembros_comite`, `comites` y `usuarios` en el repositorio concreto.
*   **Consecuencias:**
    *   **Positivas:** Separación clara de comandos (escribir) y consultas (leer) (principios tipo CQRS a nivel de archivo). Menor tamaño de empaquetado para funciones individuales.
    *   **Negativas:** Incremento en el número de archivos físicos de enrutamiento en la capa de entrada.

### 3. Inicialización e Importación Prioritaria de Extensiones de Zod OpenAPI (Módulo `extend-zod.ts`)
*   **Contexto:** Al intentar compilar los esquemas con nombre de respuestas DTOs en `registry.ts`, se presentaba el error `TypeError: zodSchema.openapi is not a function`. Esto ocurría porque los DTOs importados síncronamente al inicio de `registry.ts` evaluaban esquemas Zod antes de que se ejecutara la función `extendZodWithOpenApi(z)`.
*   **Decisión:** Crear un archivo de inicialización aislado `src/shared-kernel/openapi/extend-zod.ts` que extienda Zod inmediatamente. Luego, importar este archivo como la primerísima línea en `registry.ts` para garantizar la ejecución de la extensión antes de la evaluación de cualquier DTO importado posteriormente.
*   **Consecuencias:**
    *   **Positivas:** Solución robusta al orden de ejecución en ES Modules que permite usar libremente la API fluida `.openapi()` de Zod en DTOs autodeclarados.
    *   **Negativas:** Ninguna.

### 4. Documentación de Variables de Entorno de Cloudinary en `.env.example`
*   **Contexto:** La introducción de firmas criptográficas para Cloudinary requiere que cualquier desarrollador configure localmente sus credenciales de Cloudinary. Sin embargo, estas no estaban documentadas en el archivo de plantilla `.env.example`.
*   **Decisión:** Se agregaron las variables de entorno `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET` al archivo `.env.example` con comentarios instructivos.
*   **Consecuencias:**
    *   **Positivas:** Evita fallos de arranque silenciosos en nuevos entornos y facilita el onboarding de desarrollo.
    *   **Negativas:** Ninguna.

### 5. Consolidación de Endpoints mediante Monolithic Serverless Router (ADR 0004)
*   **Contexto:** El plan Hobby de Vercel impone un límite estricto de 12 Serverless Functions por despliegue. Dado que el proyecto creció a 18 endpoints, el despliegue nativo fallaba sistemáticamente.
*   **Decisión:** Abandonar el enrutamiento nativo por carpetas de Vercel en `api/` y consolidar todo el tráfico en Express utilizando el punto de entrada catch-all `/api/[...slug].ts`. Los archivos de controladores individuales se movieron a la infraestructura de sus respectivos Bounded Contexts.
*   **Implementación:**
    *   **Enrutador Express centralizado:** Creado en [backend/api/\[...slug\].ts](file:///home/joel/Proyectos%20Full-Stack/reports/backend/api/%5B...slug%5D.ts), el cual recibe todas las solicitudes y las despacha a los controladores reubicados en `src/`.
    *   **Adapter Wrapper (`adapt`):** Envuelve los controladores existentes. Para conservar compatibilidad con validaciones Zod y parámetros dinámicos, copia `req.params` en `req.query`.
    *   **Parche de Inmutabilidad de `req.query`:** Dado que el objeto request de Vercel define `req.query` como un read-only getter, Express fallaba al intentar asignarle valores directamente. Se solucionó redefiniendo la propiedad dinámicamente mediante `Object.defineProperty(req, 'query', { value: ... })` inyectada en el wrapper.
*   **Consecuencias:**
    *   **Positivas:** Se redujo el número de funciones serverless a solo 2 (`api/[...slug].ts` y `api/health.ts`), logrando un despliegue exitoso en el plan Hobby. Se mantiene la modularidad y "Screaming Architecture" al remover adaptadores de la raíz del proyecto.
    *   **Negativas:** Se pierde el enrutamiento automático basado en archivos de Vercel; nuevos endpoints deben registrarse explícitamente en la aplicación de Express central.

---

## 📋 Tareas Pendientes e Hitos Inmediatos
- [x] Crear el archivo `.env` local real y configurar `JWT_SECRET` y la API Key de Neon.
- [x] Levantar el proxy local en Docker de Neon (`neon_local:v1.5`) usando credenciales estáticas `neon:npg`.
- [x] Ejecutar migraciones Drizzle en el entorno local de desarrollo para poblar la rama efímera.
- [x] Diseñar e implementar el script de sembrado de territorio (`pnpm db:seed`) con más de 100 barrios de Guayaquil.
- [x] Desarrollar, desplegar y validar los casos de uso y endpoints del dominio `authentication` (`login` y `me`).
- [x] Redactar la documentación técnica del backend, APIs y middlewares en [api-and-source-documentation.md](file:///home/joel/Proyectos%20Full-Stack/reports/backend/docs/api-and-source-documentation.md).
- [x] Diseñar e implementar el flujo público y atómico de alta para líderes y comités barriales (ADR 0004).
- [x] Refactorizar la base de datos y esquema de incidentes para utilizar restricciones SQL `CHECK` en el campo `estado` (VARCHAR).
- [x] Diseñar e implementar el flujo de subidas firmadas a Cloudinary e insertar reportes ciudadanos (`POST /api/incidents/create`).
- [x] Implementar la consulta y listado de reportes barriales activos (`GET /api/incidents/list`).
- [x] Diseñar e implementar el endpoint de comentarios en reportes (`POST` y `GET /api/incidents/[id]/comments`).
- [x] Diseñar e implementar el endpoint de registro de gestión administrativa (`POST /api/incidents/[id]/management`) para líderes/miembros.
- [ ] Renombrar la columna `lider_id` a `usuario_id` en la tabla `gestiones_directiva` mediante una migración de Drizzle.
- [ ] Continuar estructurando las capas concéntricas de los dominios (`worker-profile`, `identity-validation`, etc.).
- [x] Corregir la regla de `rewrites` obsoleta en [vercel.json](file:///home/joel/Proyectos%20Full-Stack/reports/backend/vercel.json) que apunta a `api/index.ts` (archivo inexistente) redirigiéndola a `api/[...slug].ts` para solucionar problemas de comunicación del frontend con la API en producción.
