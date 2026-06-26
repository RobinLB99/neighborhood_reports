# Memoria de Sesión (MEMORY.md)

Este archivo sirve para mantener el estado y las decisiones de diseño arquitectónico implementadas en el monorepo.

---

## 📌 Estado del Proyecto
*   **Backend:** Node.js/Vercel (Serverless).
*   **Frontend:** Astro + Preact (Component Islands).
*   **Package Manager:** `pnpm`.

---

## 🛠️ Últimas Correcciones e Hitos

### 1. Fix en el Hook de Autenticación (`useAuth.ts`)
*   **Problema:** Se producía un `ReferenceError: cachedUser is not defined` al fallar el llamado a la API, provocando que la aplicación no pudiera manejar correctamente la redirección del usuario y se interrumpiera la ejecución.
*   **Solución:** Se depuró el archivo [useAuth.ts](file:///home/joel/Proyectos%20Full-Stack/reports/frontend/src/modules/auth/application/useAuth.ts). Se eliminó la referencia a la variable inexistente `cachedUser` y ahora se consulta directamente el valor serializado en `localStorage.getItem('auth_user')` para verificar si existe una sesión previa en caché antes de arrojar un error de acceso no autorizado.

### 2. Fix de Pantalla en Blanco en el Formulario de Incidencias (`ReportIncidentForm.tsx`)
*   **Problema:** La ruta `/dashboard/reportar` renderizaba una pantalla vacía sin controles de error visibles. Esto se debía a dos factores:
    1.  **Crash en la Evaluación del Módulo:** La mutación global `delete (L.Icon.Default.prototype as any)._getIconUrl` se ejecutaba en la raíz del módulo durante la fase de empaquetado/optimización de Vite. Esto causaba un `TypeError` fatal en el cliente al no estar completamente acoplado el objeto `window` o las dependencias de Leaflet.
    2.  **Ausencia de Layout de Dashboard:** El componente no implementaba las etiquetas semánticas `<header>` y `<main>` que sí utilizaban el resto de las páginas del panel.
*   **Solución:** Se refactorizó el archivo [ReportIncidentForm.tsx](file:///home/joel/Proyectos%20Full-Stack/reports/frontend/src/modules/incidents/ui/ReportIncidentForm.tsx):
    *   **Aislamiento Seguro (Sandboxing):** Se trasladó toda la lógica de modificación del prototipo y definición de URLs de iconos de Leaflet **dentro del hook `useEffect`** encargado de inicializar el mapa. Esto garantiza que la inicialización ocurra exclusivamente cuando el componente está montado en el navegador.
    *   **Integración Estructural (Layout):** Se reestructuró el JSX retornado envolviendo el formulario en un contenedor `<div class="min-h-screen bg-chalk">`, agregando un header consistente con migas de pan y botón de cerrar sesión funcional (vinculado a `logout` de `useAuth`), y ubicando el formulario dentro de un contenedor `<main>`.
    *   **Validación de Compilación:** Se ejecutó `pnpm build` de manera exitosa en el frontend, asegurando que no existan fallos de tipado o empaquetado estático.

### 3. Centralización del App Header en el Frontend
*   **Problema:** El header de la aplicación estaba duplicado y de forma desigual en `Dashboard.tsx`, `CommitteeManager.tsx` y `ReportIncidentForm.tsx`. Las páginas de Comité e Incidencias carecían del menú de perfil interactivo completo (dropdown) que sí tenía el Dashboard, ofreciendo una experiencia de usuario inconsistente.
*   **Solución:** Se refactorizó la estructura del frontend:
    *   **Creación del Componente Común:** Se diseñó y creó el componente Preact [AppHeader.tsx](file:///home/joel/Proyectos%20Full-Stack/reports/frontend/src/shared/components/ui/AppHeader.tsx) en la carpeta compartida. Este componente encapsula el dropdown del perfil de usuario y la lógica de cierre automático al hacer clic fuera del mismo.
    *   **Migración de Vistas:** Se modificaron [Dashboard.tsx](file:///home/joel/Proyectos%20Full-Stack/reports/frontend/src/modules/dashboard/Dashboard.tsx), [CommitteeManager.tsx](file:///home/joel/Proyectos%20Full-Stack/reports/frontend/src/modules/committee/ui/CommitteeManager.tsx) y [ReportIncidentForm.tsx](file:///home/joel/Proyectos%20Full-Stack/reports/frontend/src/modules/incidents/ui/ReportIncidentForm.tsx) para importar y renderizar `<AppHeader>` pasándole como props la información del usuario, la función `logout` de `useAuth`, y el título dinámico (e.g. `pageTitle="Guayaquil"`, `pageTitle="Gestión del Comité"`, `pageTitle="Reportar Incidencia"`).
    *   **Enlace de Navegación Consistente:** Se configuró el texto principal "Reportes Barriales" como un enlace activo (`a`) que redirige a `/dashboard` en todo momento, mejorando la navegación interna de la aplicación.
    *   **Validación:** Se validó la compilación estática del frontend (`pnpm run build`), garantizando que TypeScript y Astro se compilen con éxito con el nuevo tipado y estructura modular.

---

## ⚠️ Lecciones Aprendidas y Buenas Prácticas
*   **Aislamiento de Código de Navegador (Leaflet/DOM):** En aplicaciones que utilizan Astro con arquitectura de islas de hidratación (como `client:only`), cualquier librería que interactúe con el DOM o asuma variables globales de cliente (como `L` de Leaflet) **no debe ser manipulada globalmente en el cuerpo del archivo**. Toda configuración de prototipos, accesos a `window` o manipulación de elementos debe estar contenida en hooks que corran exclusivamente en cliente (por ejemplo, `useEffect`).
*   **Paridad de UI:** Los layouts no deben ser asumidos como provistos mágicamente por el index HTML a menos que formen parte de una plantilla global. Las vistas del dashboard deben inyectar e integrar explícitamente sus contenedores principales (`<header>` y `<main>`) para asegurar la correcta colocación y comportamiento de los estilos CSS globales del proyecto.
*   **Principio DRY en Component Islands:** Al trabajar con múltiples islas interactivas independientes en Astro, los componentes de layout compartidos (como barras de navegación o cabeceras) que manejan estado de interfaz (como dropdowns con lógica de "click outside") deben ser centralizados en componentes compartidos. Esto previene la duplicación de código e inconsistencias de estilos/comportamientos, haciendo que cualquier actualización futura de la cabecera se realice desde un único archivo.

