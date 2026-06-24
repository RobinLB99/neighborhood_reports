import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Extender Zod globalmente con OpenAPI al evaluar este módulo
extendZodWithOpenApi(z);
