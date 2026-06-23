import { extendZodWithOpenApi, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { LoginSchema } from "../../authentication/application/dtos/LoginDto.js";
import { RegisterFirstMemberSchema } from "../../committee/application/dtos/RegisterFirstMemberDto.js";

// Extend Zod to support the .openapi() extension method
extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// Register Schemas
const LoginResponseSchema = registry.register("LoginResponse", z.object({
  message: z.string(),
  data: z.object({
    token: z.string(),
  }),
}));

const MeResponseSchema = registry.register("MeResponse", z.object({
  message: z.string(),
  data: z.object({
    id: z.number(),
    nombre: z.string(),
    usuario: z.string(),
    rol: z.string(),
    barrioId: z.number().nullable(),
  }),
}));

const RegisterFirstMemberResponseSchema = registry.register("RegisterFirstMemberResponse", z.object({
  message: z.string(),
  data: z.object({
    comiteId: z.number(),
    usuarioId: z.number(),
    miembroId: z.number(),
  }),
}));

// Register Security Scheme
registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

// Register Endpoints
registry.registerPath({
  method: "post",
  path: "/api/auth/login",
  summary: "Iniciar sesión",
  description: "Permite a los usuarios del sistema iniciar sesión y obtener un token JWT firmado.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: LoginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Autenticación exitosa.",
      content: {
        "application/json": {
          schema: LoginResponseSchema,
        },
      },
    },
    400: {
      description: "El payload enviado no cumple con las validaciones requeridas.",
    },
    401: {
      description: "El nombre de usuario o la contraseña son incorrectos.",
    },
    500: {
      description: "Error interno del servidor.",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/auth/me",
  summary: "Obtener perfil del usuario",
  description: "Recupera el perfil del usuario autenticado que emite la solicitud.",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Perfil de usuario recuperado exitosamente.",
      content: {
        "application/json": {
          schema: MeResponseSchema,
        },
      },
    },
    401: {
      description: "No autorizado o token JWT inválido.",
    },
    404: {
      description: "Usuario no encontrado.",
    },
    500: {
      description: "Error interno del servidor.",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/committee/register-first",
  summary: "Fundar un comité barrial",
  description: "Permite fundar un comité barrial y registrar al primer miembro administrador (Presidente).",
  request: {
    body: {
      content: {
        "application/json": {
          schema: RegisterFirstMemberSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Comité barrial registrado exitosamente.",
      content: {
        "application/json": {
          schema: RegisterFirstMemberResponseSchema,
        },
      },
    },
    400: {
      description: "El payload enviado no cumple con las validaciones requeridas.",
    },
    404: {
      description: "Barrio no encontrado.",
    },
    409: {
      description: "Conflicto por duplicidad (el comité o el usuario ya existen).",
    },
    500: {
      description: "Error interno del servidor.",
    },
  },
});
