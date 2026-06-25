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
5.  **Mural de Reportes Barriales y Rediseño a Social Feed [2026-06-24]:**
    *   *Impacto técnico:*
        *   **Arquitectura Hexagonal (Dominio, Aplicación, Infraestructura):** Se agregaron los contratos y la implementación HTTP de `getActiveIncidents` en `IncidentRepository.ts` y `HttpIncidentRepository.ts`, coordinados por el caso de uso `GetActiveIncidentsUseCase.ts`.
        *   **Capa UI e Isla Reactiva (Preact):** Se implementó inicialmente un formato de tabla y luego se rediseñó a un formato de feed vertical tipo red social (`IncidentsFeed.tsx`) para una visualización más moderna e interactiva de incidencias.
        *   **Características del Feed:** Cada tarjeta (`article`) cuenta con badges minimalistas de estado (píldoras con radio de 26px), descripción en Geist con espaciado optimizado, medios en formato responsivo (`aspect-video`) con zoom en modal de pantalla completa, y un pie con la dirección del reporte y un enlace interactivo de altura accesible (45px) a Google Maps para geolocalización física real.
        *   **Limpieza de Deuda Técnica:** Se eliminó por completo el componente antiguo `IncidentsTable.tsx` una vez integrado y verificado el feed en `Dashboard.tsx` mediante `pnpm build`.
6.  **Botón de Apoyos (Corazón) a Incidencias en Mural [2026-06-24]:**
    *   *Impacto técnico:*
        *   **Capa Dominio:** Creación de la entidad `SupportStats` y modificación de la interfaz `IncidentRepository` para declarar los contratos `getIncidentSupports` y `toggleIncidentSupport`.
        *   **Capa Infraestructura:** Implementación de adaptadores en `HttpIncidentRepository` apuntando a los endpoints `/api/incidents/{id}/supports` (`GET` y `POST`).
        *   **Capa Aplicación:** Creación de los casos de uso `GetIncidentSupportsUseCase` y `ToggleIncidentSupportUseCase`.
        *   **Capa UI e Isla Reactiva (Preact):** Diseño de `IncidentSupportButton.tsx` con manejo de estados asíncronos y actualizaciones optimistas automáticas (con rollback ante fallos en red). Alojado de forma aislada en el feed para evitar re-renderizaciones globales innecesarias. Cumple con los requisitos monocromáticos de `DESIGN.md` e interacción mínima accesible de `44px`.
7.  **Comentarios en Reportes Barriales [2026-06-24]:**
    *   *Impacto técnico:*
        *   **Capa Dominio:** Creación de la entidad `Comment` y actualización de `IncidentRepository` declarando el método `addComment`.
        *   **Capa Aplicación:** Creación de `AddIncidentCommentUseCase` que gestiona las reglas del negocio de envío de comentarios (validación de mensaje no vacío, longitud máxima de 500 caracteres, y token/ID requeridos).
        *   **Capa Infraestructura:** Implementación del endpoint `POST /api/incidents/{id}/comments` en `HttpIncidentRepository` validando la respuesta mediante un esquema de Zod (`commentResponseSchema`) e integrando la captura de errores del servidor.
        *   **Capa UI:** Creación del componente `IncidentCommentForm.tsx` (Preact) con una sección de formulario que contiene un `textarea` con contador de caracteres (`0/500`) y un botón de envío que respeta la directiva de área táctil mínima (>= 44px).
        *   **Integración en Feed:** Inserción de un botón interactivo "Comentar" en las acciones inferiores de cada tarjeta de `IncidentsFeed.tsx`. Este botón controla un estado local reactivo que despliega y oculta condicionalmente la sección de comentarios en formato acordeón.
8.  **Visualización de Comentarios para Roles Líder y Miembro [2026-06-24]:**
    *   *Impacto técnico:*
        *   **Capa Dominio:** Modificación de `IncidentRepository` para declarar el método `getComments` que retorna `Comment[]`.
        *   **Capa Infraestructura:** Implementación del método `getComments` en `HttpIncidentRepository` realizando un `GET` a `/api/incidents/{id}/comments` y validando el arreglo de datos vía `z.array(commentResponseSchema)`.
        *   **Capa Aplicación:** Creación del caso de uso `GetIncidentCommentsUseCase` para el flujo limpio de recuperación de comentarios.
        *   **Capa UI e Isla Reactiva (Preact):**
            *   Desarrollo de `IncidentCommentsModal.tsx` como componente modal interactivo sobre fondo oscurecido y con scroll interno. Recupera datos asíncronos en el ciclo de montaje e implementa estados de carga, error y lista vacía bajo el diseño brutalista monocromático de `DESIGN.md`.
            *   De forma temporal, se muestra el ID de cada usuario en el cuerpo de los comentarios.
            *   Se inyectó `userRole` desde `Dashboard.tsx` a `IncidentsFeed.tsx`.
            *   Agregado condicionalmente el botón táctil "Ver Comentarios" (con ícono descriptivo y tamaño accesible) solo si el rol del usuario es `lider` o `miembro`.
            *   **Optimización Mobile de Botones:** Se ajustó la UI en `IncidentsFeed.tsx` para colapsar a solo íconos (`hidden sm:inline`) los textos de "Comentar", "Ver Comentarios" y "Ver en Google Maps" en móviles, transformándolos en botones cuadrados compactos (`w-11 sm:w-auto px-0 sm:px-4`). El botón de apoyo en `IncidentSupportButton.tsx` conserva su contador visible ajustando su padding a `px-3 sm:px-4` para optimizar espacio.

## Siguientes Pasos
1.  **Auditoría de Componentes UI Existentes:** Revisar las implementaciones actuales en la capa `ui/` de cada módulo para asegurar la adopción de los nuevos tokens `--spacing-*` y tipografías en unidades `rem`.
2.  **Validación de Estados de Foco y Contraste:** Asegurar que los componentes interactivos utilicen indicadores de enfoque altamente visibles que cumplan con la relación de contraste **3:1** (WCAG 1.4.11) sobre fondo blanco.
3.  **Refactorización de Creación de Gestión Directiva (POST) en Modal:** Extraer la llamada HTTP POST directa de `DirectiveManagementModal.tsx` (`handleSubmit`) a un caso de uso (`CreateIncidentGestionUseCase`) y al repositorio correspondiente para cumplir al 100% con la Arquitectura Hexagonal.

