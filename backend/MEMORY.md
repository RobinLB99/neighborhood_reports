# 🧠 Memoria del Proyecto (MEMORY.md)

Este archivo sirve para preservar el contexto de las decisiones técnicas y arquitectónicas entre sesiones. **DEBE actualizarse al final de cada sesión relevante.**

---

## 📅 Estado y Contexto General
*   **Fecha de Creación:** 20 de Junio, 2026
*   **Última Actualización:** 23 de Junio, 2026 (por Jarvis - Senior Software Architect)
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

### 3. Documentación Inline mediante Estándar TSDoc/JSDoc
*   **Contexto:** Los desarrolladores y sistemas automatizados requieren comprender con rapidez las responsabilidades arquitectónicas, contratos de entrada/salida y posibles excepciones sin tener que leer toda la lógica imperativa.
*   **Decisión:** Se documentó en código fuente los componentes clave (Middlewares, Driving Adapters, Use Cases y Domain Entities) utilizando comentarios en bloque JSDoc/TSDoc estructurados.
*   **Implementación:**
    *   Se especificaron flujos lógicos, parámetros `@param`, tipos de retorno `@returns` y excepciones lanzadas `@throws` en todos los archivos del núcleo y límites del backend.
*   **Consecuencias:**
    *   **Positivas:** Mejora la mantenibilidad, facilita el onboarding de nuevos colaboradores y habilita la autogeneración automática de documentación de APIs y componentes del sistema.
    *   **Negativas:** Incremento marginal en el tamaño de las líneas de código, aunque irrelevante para el empaquetado final tras la transpilación a JavaScript.

### 2. Generación Automatizada del Contrato OpenAPI (`scripts/generate-openapi.ts`)
*   **Contexto:** Se requiere mantener sincronizado el contrato OpenAPI con los schemas de validación Zod existentes en el backend para que el frontend pueda auto-generar tipos y clientes de forma automatizada y sin acoplamiento directo.
*   **Decisión:** Implementar un compilador de especificación dinámico utilizando `@asteasolutions/zod-to-openapi` e instanciar un registro central en `shared-kernel`.
*   **Implementación:**
    *   Se creó [registry.ts](file:///home/joel/Proyectos%20Full-Stack/reports/backend/src/shared-kernel/openapi/registry.ts) centralizando la extensión de Zod y la matriculación de esquemas y rutas.
    *   Se desarrolló [generate-openapi.ts](file:///home/joel/Proyectos%20Full-Stack/reports/backend/scripts/generate-openapi.ts) para generar el archivo `openapi.json` resolviendo rutas absolutas de forma segura en base al directorio del comando.
*   **Consecuencias:**
    *   **Positivas:** Contrato OpenAPI autogenerado y siempre fiel a las reglas de validación en tiempo de ejecución. El frontend puede tiparse de forma 100% independiente.
    *   **Negativas:** Añade una dependencia de desarrollo adicional (`@asteasolutions/zod-to-openapi`) y requiere registrar de forma explícita cada ruta y DTO nuevo en el `registry`.

### 3. Consulta Segura de Vecinos del Barrio (GET /api/users/neighbors)
*   **Contexto:** Los líderes del comité necesitan un listado de vecinos elegibles de su propio barrio para promoverlos a cargos directivos. El frontend no debe enviar el `barrioId` de manera explícita para evitar vulnerabilidades de escalación o fuga de datos (IDOR).
*   **Decisión:** Crear un endpoint protegido por el middleware JWT que extraiga dinámicamente el `barrioId` del contexto decodificado (`x-user-barrio-id`) y delegue en el caso de uso `GetNeighborsUseCase`. El acceso está restringido exclusivamente a roles `lider` y `miembro`.
*   **Consecuencias:**
    *   **Positivas:** Seguridad total en la consulta basada en el JWT (evita que un líder consulte vecinos de otro barrio alterando parámetros). Cumple con el principio de menor privilegio.
    *   **Negativas:** El usuario solicitante debe tener obligatoriamente un `barrioId` asignado y válido en su JWT, de lo contrario se rechaza con HTTP 400.

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

---

## 📋 Tareas Pendientes e Hitos Inmediatos
- [x] Crear el archivo `.env` local real y configurar `JWT_SECRET` y la API Key de Neon.
- [x] Levantar el proxy local en Docker de Neon (`neon_local:v1.5`) usando credenciales estáticas `neon:npg`.
- [x] Ejecutar migraciones Drizzle en el entorno local de desarrollo para poblar la rama efímera.
- [x] Diseñar e implementar el script de sembrado de territorio (`pnpm db:seed`) con más de 100 barrios de Guayaquil.
- [x] Desarrollar, desplegar y validar los casos de uso y endpoints del dominio `authentication` (`login` y `me`).
- [x] Redactar la documentación técnica del backend, APIs y middlewares en [api-and-source-documentation.md](file:///home/joel/Proyectos%20Full-Stack/reports/backend/docs/api-and-source-documentation.md).
- [x] Diseñar e implementar el flujo público y atómico de alta para líderes y comités barriales (ADR 0004).
- [ ] Continuar estructurando las capas concéntricas de los dominios (`worker-profile`, `identity-validation`, etc.).



