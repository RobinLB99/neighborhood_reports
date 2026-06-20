# 🧠 Memoria del Proyecto (MEMORY.md)

Este archivo sirve para preservar el contexto de las decisiones técnicas y arquitectónicas entre sesiones. **DEBE actualizarse al final de cada sesión relevante.**

---

## 📅 Estado y Contexto General
*   **Fecha de Creación:** 20 de Junio, 2026
*   **Última Actualización:** 20 de Junio, 2026 (por Jarvis - Senior Software Architect)
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

## 📋 Tareas Pendientes e Hitos Inmediatos
- [ ] Crear el archivo `.env` local real a partir de `.env.example` y configurar la API Key de Neon.
- [ ] Levantar el contenedor local con `docker compose up` y verificar que el proxy de Neon inicie correctamente.
- [ ] Ejecutar migraciones Drizzle en el entorno local de desarrollo para poblar la rama efímera.
- [ ] Continuar estructurando las capas concéntricas de los dominios (`worker-profile`, `identity-validation`, etc.).
