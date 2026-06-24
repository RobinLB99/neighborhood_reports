# Memoria de Contexto del Proyecto — Frontend de Reportes de Vecindario

## Información General
*   **Fecha de Última Actualización:** 2026-06-24
*   **Arquitecto a Cargo:** Jarvis (AI Senior Software Architect)

## Estado de la Arquitectura
El proyecto se rige por las directrices de **Astro + Arquitectura Hexagonal y Limpia** descritas en [AGENTS.md](file:///home/joel/Proyectos%20Full-Stack/reports/frontend/AGENTS.md).
*   **Gestor de Dependencias:** `pnpm`
*   **Estructura de Directorios:** Dominio-céntrica dentro de `src/modules/[domain]`, segmentada estrictamente en las capas `domain`, `application`, `infrastructure` y `ui`.

## Hitos y Decisiones Clave Implementadas
1.  **Refactorización de Espaciados y Tipografía para Accesibilidad (WCAG 2.1/2.2) [2026-06-22]:**
    *   *Documento de Referencia:* [DESIGN.md](file:///home/joel/Proyectos%20Full-Stack/reports/frontend/DESIGN.md)
    *   *ADR Vinculado:* [ADR 001: Refactorización de Espaciados y Tipografía para Accesibilidad](file:///home/joel/.gemini/antigravity-cli/brain/ae4cf259-e3ae-4f8a-a56e-ad9e5720bc9e/adr_001_accessible_spacing_and_typography.md)
    *   *Impacto técnico:*
        *   Conversión de variables CSS y Tailwind v4 de píxeles estáticos (`px`) a unidades relativas adaptables (`rem`).
        *   Garantía de objetivo de toque mínimo de **44px** (`2.75rem`) para botones y campos interactivos, junto con pautas de expansión invisible mediante pseudoelementos CSS para componentes más pequeños (como badges o tags).
        *   Aumento de la separación entre elementos interactivos (gaps mínimos de `12px` / `0.75rem`) para mitigar toques erróneos.
        *   Relajación de la altura de línea de display a `1.25` y del cuerpo a `1.50` para evitar colisión tipográfica (cumplimiento WCAG 1.4.12).
2.  **Redirección y Validación de Sesión Unificada [2026-06-24]:**
    *   *Impacto técnico:*
        *   Se reemplazó la vista de bienvenida de Astro en `index.astro` por una redirección limpia a `/dashboard`.
        *   Se implementó el custom hook centralizado `useAuth` (`src/modules/auth/application/useAuth.ts`) que gestiona el estado de sesión (`localStorage`, validación de token y logout) y actúa como guardián de rutas redirigiendo a `/login` en caso de sesión inválida.
        *   Se refactorizó el componente `Dashboard` para consumir la sesión mediante este hook (`useAuth({ requireAuth: true })`).
3.  **Gestión de Miembros del Comité [2026-06-24]:**
    *   *Impacto técnico:*
        *   **Sincronización de Contratos API:** Se sincronizó `openapi.json` desde el backend y se regeneró `src/shared/types/api.ts` con los nuevos tipos de endpoints `/api/committee/members`, `/api/committee/members/list` y `/api/users/neighbors`.
        *   **Arquitectura Hexagonal (Dominio y Aplicación):** Se estructuró el módulo `committee` con entidades de dominio (`CommitteeMember`, `Neighbor`), puerto del repositorio (`CommitteeRepository`), casos de uso dedicados (`GetCommitteeMembersUseCase`, `GetEligibleNeighborsUseCase`, `RegisterCommitteeMemberUseCase`) e implementación de infraestructura (`HttpCommitteeRepository`).
        *   **Capa UI e Integración:** Se implementaron islas reactivas con Preact (`CommitteeManager`, `CommitteeMembersList`, `RegisterMemberForm`) respetando el sistema de diseño brutalista monocromático y las pautas táctiles de accesibilidad (objetivos de toque > 44px).
        *   **Ruta de Entrega (Delivery):** Se integró la nueva ruta `/dashboard/miembros` mediante la página Astro `src/pages/dashboard/miembros.astro` y se enlazó desde el panel principal en el `Dashboard`.
4.  **Módulo de Registro de Incidencias Barriales y Subidas Firmadas a Cloudinary [2026-06-24]:**
    *   *Impacto técnico:*
        *   **Orquestación asíncrona en 3 pasos:** Se implementó `ReportIncidentUseCase` para dividir la subida en: 1) Solicitud de firma temporal HMAC-SHA1 al backend, 2) Carga directa de la imagen binaria desde el cliente a Cloudinary, 3) Envío del payload final (con URL optimizada de imagen `q_auto,f_auto` y coordenadas) al backend.
        *   **Geolocalización y Mapa:** Se integró la librería Leaflet con mapas base de OpenStreetMap dentro de la isla reactiva de Preact `ReportIncidentForm.tsx`, permitiendo seleccionar coordenadas exactas (`latitud,longitud`) de forma visual e intuitiva y/o usar geolocalización nativa del navegador.
        *   **Floating Action Button (FAB):** Se agregó un botón flotante con el ícono `+` en el `Dashboard` (`Dashboard.tsx`) anclado en `fixed bottom-6 right-6` para acceso rápido y limpio al reporte, removiendo el banner estático redundante que ocupaba espacio visual principal.
        *   **Manejo de Errores y Tolerancia a Fallos:** Se encapsularon los errores en excepciones de dominio y se implementó una máquina de estados visual (`useIncidentForm`) que preserva la imagen pre-subida si falla el paso final, evitando la redundancia de red al reintentar el registro.

## Siguientes Pasos
1.  **Auditoría de Componentes UI Existentes:** Revisar las implementaciones actuales en la capa `ui/` de cada módulo para asegurar la adopción de los nuevos tokens `--spacing-*` y tipografías en unidades `rem`.
2.  **Validación de Estados de Foco y Contraste:** Asegurar que los componentes interactivos utilicen indicadores de enfoque altamente visibles que cumplan con la relación de contraste **3:1** (WCAG 1.4.11) sobre fondo blanco.
