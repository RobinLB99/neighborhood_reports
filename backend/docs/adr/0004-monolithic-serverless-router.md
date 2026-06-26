# ADR 0004: Consolidación de Serverless Functions (Monolithic API Router)

## Status
Proposed (En proceso de implementación)

## Context
El plan Hobby de Vercel impone un límite estricto de 12 Serverless Functions por cada despliegue. Nuestra arquitectura actual se apoya en el enrutamiento por sistema de archivos de Vercel (`api/`), donde cada archivo TypeScript se despliega como una función Serverless independiente. Dado que el proyecto ha crecido y cuenta con más de 13 controladores HTTP (endpoints), los despliegues en el entorno gratuito están fallando sistemáticamente.

## Decision
Abandonar el enrutamiento nativo por sistema de archivos de Vercel y adoptar el patrón **Monolithic Serverless Router**. 
1. Se consolidará todo el tráfico de la API a través de un único punto de entrada: `api/index.ts`.
2. Se utilizará `Express` como adaptador y enrutador interno debido a su alta compatibilidad con los objetos `req` y `res` nativos de Vercel/Node.
3. Se migrarán los handlers actuales ubicados en la carpeta `api/` hacia la capa de infraestructura correspondiente de cada Bounded Context (Screaming Architecture).
4. Se configurará `vercel.json` con una regla de `rewrites` para canalizar el tráfico.

## Consequences
**Positivas:**
- Evadimos el límite de 12 funciones de Vercel al consumir exactamente 1 función para toda la API.
- Reafirmamos los principios de *Screaming Architecture*, eliminando lógica de enrutamiento y adaptadores de la raíz del proyecto.
- Se facilita la inyección global de middlewares (CORS, trazabilidad).

**Negativas:**
- Pérdida de la conveniencia de crear rutas automáticamente agregando archivos. Ahora requerirá registro explícito en el enrutador maestro.
- Leve incremento teórico en los tiempos de cold start de la Lambda principal, que es despreciable en un entorno Node.js moderno.

## References
- Error de Vercel: "No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan."
- Conversación de diagnóstico arquitectónico.
