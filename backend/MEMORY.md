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

---


## 📋 Tareas Pendientes e Hitos Inmediatos
- [x] Crear el archivo `.env` local real y configurar `JWT_SECRET` y la API Key de Neon.
- [x] Levantar el proxy local en Docker de Neon (`neon_local:v1.5`) usando credenciales estáticas `neon:npg`.
- [x] Ejecutar migraciones Drizzle en el entorno local de desarrollo para poblar la rama efímera.
- [x] Diseñar e implementar el script de sembrado de territorio (`pnpm db:seed`) con más de 100 barrios de Guayaquil.
- [x] Desarrollar, desplegar y validar los casos de uso y endpoints del dominio `authentication` (`login` y `me`).
- [x] Redactar la documentación técnica del backend, APIs y middlewares en [api-and-source-documentation.md](file:///home/joel/Proyectos%20Full-Stack/reports/backend/docs/api-and-source-documentation.md).
- [ ] Continuar estructurando las capas concéntricas de los dominios (`worker-profile`, `identity-validation`, etc.).



