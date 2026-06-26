import express, { type Request, type Response, type Express } from "express";

// Importar todos los controladores (Driving Adapters) desde sus nuevos destinos
import healthHandler from "../src/shared-kernel/http/controllers/health.js";
import signatureHandler from "../src/shared-kernel/storage/infrastructure/http/controllers/signature.js";

import loginHandler from "../src/authentication/infrastructure/http/controllers/login.js";
import meHandler from "../src/authentication/infrastructure/http/controllers/me.js";
import registerLeaderHandler from "../src/authentication/infrastructure/http/controllers/register-leader.js";
import registerHandler from "../src/authentication/infrastructure/http/controllers/register.js";
import neighborsHandler from "../src/authentication/infrastructure/http/controllers/neighbors.js";

import listMembersHandler from "../src/committee/infrastructure/http/controllers/list.js";
import membersHandler from "../src/committee/infrastructure/http/controllers/members.js";

import commentsHandler from "../src/incidents/infrastructure/http/controllers/comments.js";
import deleteIncidentHandler from "../src/incidents/infrastructure/http/controllers/delete.js";
import managementHandler from "../src/incidents/infrastructure/http/controllers/management.js";
import supportsHandler from "../src/incidents/infrastructure/http/controllers/supports.js";
import createIncidentHandler from "../src/incidents/infrastructure/http/controllers/create.js";
import listIncidentsHandler from "../src/incidents/infrastructure/http/controllers/list.js";

import cityHandler from "../src/territory/infrastructure/http/controllers/city.js";
import neighborhoodHandler from "../src/territory/infrastructure/http/controllers/neighborhood.js";
import provinceHandler from "../src/territory/infrastructure/http/controllers/province.js";

const app: Express = express();

app.use((req: Request, _res: Response, next) => {
    if (req.body && typeof req.body === "object") {
        (req as any)._body = true; // Le avisa a Express que el body ya fue parseado por Vercel
    }
    next();
});

// Middleware para parsear JSON en peticiones entrantes
app.use(express.json());

/**
 * Adaptador/Wrapper para compatibilidad entre Express y los Handlers originales de Vercel.
 * Copia los parámetros de ruta de Express (`req.params`) en `req.query` para evitar modificar
 * la validación de contratos Zod y lógica interna de los controladores existentes.
 */
const adapt = (handler: any) => {
    return async (req: Request, res: Response) => {
        // Fusionar req.params en req.query usando defineProperty para evadir el getter de Vercel
        Object.defineProperty(req, "query", {
            value: { ...req.query, ...req.params },
            configurable: true,
            enumerable: true,
            writable: true,
        });

        try {
            await handler(req as any, res as any);
        } catch (error) {
            console.error(
                "[Adapter Error] Falla en la ejecución del controlador adaptado:",
                error,
            );
            if (!res.headersSent) {
                res.status(500).json({
                    error: "Internal Server Error",
                    message:
                        "Ocurrió un error inesperado al procesar la solicitud en el enrutador central.",
                });
            }
        }
    };
};

// --- Registro de Rutas ---

// Health Check
app.all("/api/health", adapt(healthHandler));

// Storage
app.all("/api/storage/signature", adapt(signatureHandler));

// Autenticación & Usuarios
app.all("/api/auth/login", adapt(loginHandler));
app.all("/api/auth/me", adapt(meHandler));
app.all("/api/auth/register-leader", adapt(registerLeaderHandler));
app.all("/api/auth/register", adapt(registerHandler));
app.all("/api/users/neighbors", adapt(neighborsHandler));

// Comités
app.all("/api/committee/members/list", adapt(listMembersHandler));
app.all("/api/committee/members", adapt(membersHandler));

// Incidencias (Estáticas)
app.all("/api/incidents/create", adapt(createIncidentHandler));
app.all("/api/incidents/list", adapt(listIncidentsHandler));

// Incidencias (Dinámicas con ID)
app.all("/api/incidents/:id/comments", adapt(commentsHandler));
app.all("/api/incidents/:id/delete", adapt(deleteIncidentHandler));
app.all("/api/incidents/:id/management", adapt(managementHandler));
app.all("/api/incidents/:id/supports", adapt(supportsHandler));

// Territorios
app.all("/api/territory/city", adapt(cityHandler));
app.all("/api/territory/neighborhood", adapt(neighborhoodHandler));
app.all("/api/territory/province", adapt(provinceHandler));

// Manejador por defecto para rutas no registradas
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: "Not Found",
        message: `La ruta solicitada [${req.method}] ${req.url} no existe en el servidor.`,
    });
});

export default app;
