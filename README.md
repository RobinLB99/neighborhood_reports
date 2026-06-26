# 🏙️ Sistema de Reportes y Gestión Barrial (Neighborhood Reports)

![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Mode-blue?logo=typescript)
![Astro](https://img.shields.io/badge/Astro-6.4-orange?logo=astro)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D24.0-green?logo=node.js)
![Neon](https://img.shields.io/badge/Database-Neon_Serverless_Postgres-00e599?logo=postgresql)

Una plataforma descentralizada diseñada para empoderar a los ciudadanos y comités barriales. Este sistema permite reportar incidencias locales, gestionar apoyos, administrar directivas y mantener una comunicación fluida entre los vecinos y sus representantes oficiales.

**No es solo una aplicación, es una arquitectura robusta diseñada para escalar.**

---

## 🏛️ Arquitectura del Sistema (El "Iron Suit")

Este proyecto repudia el código acoplado y la mediocridad técnica. Está construido bajo los principios de **Screaming Architecture**, **Clean Architecture** y **Arquitectura Hexagonal (Puertos y Adaptadores)**. Si miras la estructura de carpetas, el proyecto "grita" de qué trata el negocio antes de mostrarte qué framework utiliza.

### Estructura del Proyecto

El repositorio contiene dos subproyectos independientes, cada uno gestionando sus propias dependencias a través de workspaces independientes de `pnpm`:

*   📂 **`/backend` (Capa de Reglas de Negocio e Infraestructura):**
    *   Vercel Serverless Functions (Node.js).
    *   Validación perimetral en el Edge (Vercel Middleware) mediante JWT y la librería ligera `jose`.
    *   Drizzle ORM conectado a Neon Serverless Postgres.
    *   Validación estricta de contratos de entrada/salida con Zod.
*   📂 **`/frontend` (Capa de Presentación Consumidora):**
    *   Astro configurado con `ClientRouter` (SPA Feel) y transiciones fluidas.
    *   Preact Islands para interactividad encapsulada.
    *   Estilos mediante TailwindCSS v4 siguiendo directrices de diseño brutalista y alta accesibilidad táctil (WCAG 2.1/2.2).
    *   Consumo de APIs fuertemente tipado.
*   📂 **`/contracts` (La Fuente de la Verdad):**
    *   Contiene la especificación OpenAPI (`openapi.json`). Funciona como el contrato estricto e inviolable entre el Backend y el Frontend.

---

## 🛠️ Stack Tecnológico

*   **Lenguaje Universal:** TypeScript en modo estricto (`"strict": true`).
*   **Base de Datos:** PostgreSQL vía Neon Cloud en producción (simulado localmente en desarrollo usando Docker con la imagen `neon_local:v1.5` para paridad de base de datos).
*   **ORM:** Drizzle (Tipado seguro de extremo a extremo y gestión de migraciones).
*   **Gestión de Medios:** Cloudinary mediante *Signed Uploads* para saltarse los cuellos de botella de Serverless (cero parsing binario en Vercel, optimizando los Cold Starts).
*   **Gestor de Paquetes:** `pnpm` (Uso obligatorio por su velocidad y aislamiento con pnpm-workspace).

---

## 🔄 Flujo de Desarrollo (Contract-First / End-to-End)

Si vas a desarrollar una nueva característica (feature), ESTE es el orden cronológico innegociable de ejecución:

1.  **Backend (Definición):** Entra a `/backend` y define las entidades de dominio y esquemas de validación Zod.
2.  **Backend (Implementación):** Crea los casos de uso, repositorios de Drizzle, registra los esquemas en el `registry.ts` y expone el handler de Vercel.
3.  **Contratos (Exposición):** Ejecuta `pnpm run generate-docs` en el backend para compilar y actualizar el archivo `openapi.json` en la carpeta `/contracts`.
4.  **Frontend (Consumo):** Cambia a `/frontend`, ejecuta `pnpm run sync-api` para autogenerar los tipos TypeScript de la API, crea los adaptadores de infraestructura y, finalmente, construye la UI (Astro/Preact).

---

## 🚀 Entorno de Desarrollo Local

Olvídate de entornos frágiles de "funciona en mi máquina". Usamos contenedores para la infraestructura base.

### Prerrequisitos
*   Node.js >= 24.0
*   Docker y Docker Compose.
*   `pnpm` (Gestor de paquetes).

### Paso a Paso

1.  **Clonación y Variables de Entorno:**
    ```bash
    git clone <repo-url>
    cd reports
    
    # Prepara las variables de entorno para ambos lados
    cp backend/.env.example backend/.env
    cp frontend/.env.example frontend/.env
    ```
    *Nota Crítica: Deberás proveer claves válidas de Neon (`NEON_API_KEY`) y Cloudinary en el `.env` del backend para levantar el entorno completo.*

2.  **Instalación de Dependencias:**
    Las dependencias deben instalarse por separado en cada subproyecto debido a que operan con entornos de paquetes aislados:
    ```bash
    # Instalar dependencias del Backend
    cd backend && pnpm install

    # Instalar dependencias del Frontend
    cd ../frontend && pnpm install
    ```

3.  **Levantar Infraestructura Local (Docker - Solo para Desarrollo Local):**
    Para emular el comportamiento de Neon Postgres de forma local durante el desarrollo:
    ```bash
    cd backend
    docker-compose up -d
    ```

4.  **Base de Datos (Migraciones y Sembrado):**
    Una vez levantado PostgreSQL local, inicializa los esquemas y pobla los datos del territorio.
    ```bash
    pnpm run db:generate
    pnpm run db:migrate
    pnpm run db:seed
    ```

5.  **Ejecución de Servidores en Desarrollo:**
    *   **Backend:** `cd backend && pnpm run dev`
    *   **Frontend:** `cd frontend && pnpm run dev`

---

## 🧠 Toma de Decisiones y Memoria (ADRs)

No somos programadores que tiran código al azar. Somos arquitectos. Toda decisión estructural, trade-off, o patrón implementado está rigurosamente documentado. 
Antes de proponer un cambio, es **MANDATORIO** leer el contexto histórico:

*   **Reglas de IA y Arquitectura:** Revisa `AGENTS.md` (En la raíz, y en cada subcarpeta).
*   **Contexto del Backend:** Revisa `backend/MEMORY.md`.
*   **Contexto del Frontend:** Revisa `frontend/MEMORY.md` y `frontend/DESIGN.md`.

*Regla de Oro: Si alteras el flujo de datos, agregas una dependencia de infraestructura o tomas una decisión arquitectónica, **DEBES proponer una actualización en los archivos `MEMORY.md`**. El conocimiento tácito es el enemigo mortal de los equipos.*
