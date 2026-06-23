# ADR 0001: Implementación de Seguridad mediante Vercel Edge Middleware Global

* **Título:** Implementación de Seguridad mediante Vercel Edge Middleware Global
* **Estado:** Aceptado
* **Contexto:** En una arquitectura de micro-funciones Serverless (Vercel Functions), verificar tokens y decodificar sesiones de usuario de forma repetitiva en cada endpoint Node.js añade latencia por cold starts y llamadas repetitivas. Necesitamos un mecanismo global, de baja latencia y centralizado para autorizar peticiones antes de que alcancen las funciones serverless de la capa de entrada.

---

## Decisión

Implementar **Vercel Edge Middleware** (`middleware.ts`) en la raíz del proyecto para interceptar todas las peticiones entrantes.

1. **Autenticación Stateless (JWT):** Las firmas de tokens JWT se verificarán de forma síncrona en el Edge mediante la librería ligera `jose`. Esto evita realizar llamadas a base de datos en peticiones no autorizadas y aprovecha la red global de Vercel.
2. **Definición de Rutas Públicas:** El middleware mantendrá una lista negra/blanca de rutas exentas de validación (por ejemplo, `/api/health`, `/api/committee/register-first`, etc.).
3. **Inyección de Contexto en Cabeceras (Downstream Headers):** Tras validar con éxito el token, el middleware inyectará las cabeceras `x-user-id`, `x-user-role`, y `x-user-barrio-id` en la petición entrante antes de delegar a la función final.
4. **Helper en Shared Kernel:** Creación de un helper type-safe `getAuthenticatedUser(request)` en la capa HTTP del Shared Kernel para que los handlers serverless consuman el contexto del usuario de forma uniforme y segura.

---

## Consecuencias

### Positivas

* **Eficiencia de Costos y Recursos:** Las peticiones con tokens inválidos o expirados son bloqueadas a nivel Edge, evitando arrancar contenedores serverless (cold starts innecesarios) y ahorrando dinero.
* **Separación de Responsabilidades:** Los handlers en `api/**/*.ts` permanecen extremadamente limpios y enfocados en validar el contrato del body/query del caso de uso.
* **Rendimiento Ultrarrápido:** La validación criptográfica en el Edge tarda menos de un dígito de milisegundos en comparación con una consulta SQL de sesión.

### Negativas

* **Riesgo de Configuración (Rutas Públicas):** Si el desarrollador olvida que una ruta requiere autenticación y no la elimina de la lista de rutas públicas, esta quedará expuesta. De igual manera, si un handler asume que es seguro pero se expuso por error como público, el helper `getAuthenticatedUser` lanzará un error 500 al no detectar las cabeceras del usuario.
* **Dependencia de la Plataforma (Vercel):** Aunque `middleware.ts` es propietario del runtime Edge de Vercel, el patrón es fácilmente portable a un API Gateway estándar (como AWS API Gateway o Kong) que configure la inyección de las mismas cabeceras.

---

## Referencias

* [Vercel Routing Middleware Documentation](https://vercel.com/docs/functions/edge-middleware/middleware-api)
* Biblioteca de validación criptográfica: `jose` (Edge runtime compatible).
