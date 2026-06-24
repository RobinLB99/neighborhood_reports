import "./extend-zod.js";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { LoginSchema } from "../../authentication/application/dtos/LoginDto.js";
import { RegisterUserSchema } from "../../authentication/application/dtos/RegisterUserDto.js";
import { RegisterCommitteeSchema } from "../../committee/application/dtos/RegisterCommitteeDto.js";
import { RegisterCommitteeMemberSchema } from "../../committee/application/dtos/RegisterCommitteeMemberDto.js";
import { GetCitiesSchema } from "../../territory/application/dtos/GetCitiesDto.js";
import { GetNeighborhoodsSchema } from "../../territory/application/dtos/GetNeighborhoodsDto.js";
import { NeighborsResponseSchema } from "../../authentication/application/dtos/GetNeighborsDto.js";
import { CommitteeMembersListResponseSchema } from "../../committee/application/dtos/GetCommitteeMembersDto.js";

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

const RegisterCommitteeResponseSchema = registry.register("RegisterCommitteeResponse", z.object({
  message: z.string(),
  data: z.object({
    comiteId: z.number(),
    usuarioId: z.number(),
    miembroId: z.number(),
  }),
}));

const RegisterCommitteeMemberResponseSchema = registry.register("RegisterCommitteeMemberResponse", z.object({
  message: z.string(),
  data: z.object({
    miembroId: z.number(),
  }),
}));

const CommitteeMembersListResponseSchemaRegistered = registry.register(
  "CommitteeMembersListResponse",
  CommitteeMembersListResponseSchema
);


const RegisterUserResponseSchema = registry.register("RegisterUserResponse", z.object({
  message: z.string(),
  data: z.object({
    id: z.number(),
    nombre: z.string(),
    usuario: z.string(),
    rol: z.string(),
    barrioId: z.number(),
    fechaRegistro: z.string().optional(),
  }),
}));

const ProvinceSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  fechaCreacion: z.date().optional(),
});

const CitySchema = z.object({
  id: z.number(),
  provinciaId: z.number(),
  nombre: z.string(),
  fechaCreacion: z.date().optional(),
});

const NeighborhoodSchema = z.object({
  id: z.number(),
  ciudadId: z.number(),
  nombre: z.string(),
  fechaCreacion: z.date().optional(),
});

const ProvincesResponseSchema = registry.register("ProvincesResponse", z.object({
  message: z.string(),
  data: z.array(ProvinceSchema),
}));

const CitiesResponseSchema = registry.register("CitiesResponse", z.object({
  message: z.string(),
  data: z.array(CitySchema),
}));

const NeighborhoodsResponseSchema = registry.register("NeighborhoodsResponse", z.object({
  message: z.string(),
  data: z.array(NeighborhoodSchema),
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
  method: "post",
  path: "/api/auth/register",
  summary: "Registrar usuario",
  description: "Permite registrar un nuevo usuario en la plataforma con el rol de ciudadano.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: RegisterUserSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Usuario registrado exitosamente.",
      content: {
        "application/json": {
          schema: RegisterUserResponseSchema,
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
      description: "Conflicto: El nombre de usuario ya está en uso.",
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
  path: "/api/auth/register-leader",
  summary: "Registrar líder y fundar comité",
  description: "Permite fundar un comité barrial y dar de alta a su líder de forma pública en un solo paso.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: RegisterCommitteeSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Comité barrial y líder registrados exitosamente.",
      content: {
        "application/json": {
          schema: RegisterCommitteeResponseSchema,
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
      description: "Conflicto por duplicidad de usuario o de comité en el barrio.",
    },
    500: {
      description: "Error interno del servidor.",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/territory/province",
  summary: "Obtener todas las provincias",
  description: "Recupera la lista completa de provincias registradas en el sistema para su uso en formularios de registro.",
  responses: {
    200: {
      description: "Catálogo de provincias recuperado con éxito.",
      content: {
        "application/json": {
          schema: ProvincesResponseSchema,
        },
      },
    },
    500: {
      description: "Error interno del servidor.",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/territory/city",
  summary: "Obtener ciudades por provincia",
  description: "Recupera las ciudades asociadas a una provincia específica mediante su ID.",
  request: {
    query: GetCitiesSchema,
  },
  responses: {
    200: {
      description: "Ciudades recuperadas con éxito.",
      content: {
        "application/json": {
          schema: CitiesResponseSchema,
        },
      },
    },
    400: {
      description: "El ID de la provincia proporcionado es inválido.",
    },
    404: {
      description: "Provincia no encontrada.",
    },
    500: {
      description: "Error interno del servidor.",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/territory/neighborhood",
  summary: "Obtener barrios por ciudad",
  description: "Recupera los barrios asociados a una ciudad específica mediante su ID.",
  request: {
    query: GetNeighborhoodsSchema,
  },
  responses: {
    200: {
      description: "Barrios recuperados con éxito.",
      content: {
        "application/json": {
          schema: NeighborhoodsResponseSchema,
        },
      },
    },
    400: {
      description: "El ID de la ciudad proporcionado es inválido.",
    },
    404: {
      description: "Ciudad no encontrada.",
    },
    500: {
      description: "Error interno del servidor.",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/committee/members",
  summary: "Registrar miembro del comité",
  description: "Permite a un líder de comité barrial registrar nuevos miembros directivos (Secretario, Vocal).",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: RegisterCommitteeMemberSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Miembro del comité registrado exitosamente.",
      content: {
        "application/json": {
          schema: RegisterCommitteeMemberResponseSchema,
        },
      },
    },
    400: {
      description: "El payload enviado no cumple con las validaciones requeridas.",
    },
    403: {
      description: "Acceso denegado. Solo los líderes pueden realizar esta operación.",
    },
    404: {
      description: "Comité no encontrado para el barrio del líder.",
    },
    409: {
      description: "Conflicto: El nombre de usuario ya está en uso.",
    },
    500: {
      description: "Error interno del servidor o configuración de seguridad.",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/users/neighbors",
  summary: "Obtener vecinos elegibles del barrio",
  description: "Recupera la lista de vecinos (ciudadanos regulares) del mismo barrio que el líder o miembro solicitante para poder ser asignados al comité.",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Vecinos del barrio recuperados exitosamente.",
      content: {
        "application/json": {
          schema: registry.register("NeighborsResponse", z.object({
            message: z.string(),
            data: NeighborsResponseSchema,
          })),
        },
      },
    },
    400: {
      description: "El usuario solicitante no pertenece a ningún barrio.",
    },
    401: {
      description: "No autorizado o token JWT inválido.",
    },
    403: {
      description: "Acceso denegado. Solo líderes y miembros pueden acceder.",
    },
    500: {
      description: "Error interno del servidor.",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/committee/members/list",
  summary: "Obtener miembros del comité",
  description: "Recupera la lista completa de los miembros directivos (Presidente, Secretario, Vocal) del comité del barrio del usuario autenticado.",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Miembros del comité recuperados con éxito.",
      content: {
        "application/json": {
          schema: CommitteeMembersListResponseSchemaRegistered,
        },
      },
    },
    400: {
      description: "El usuario solicitante no pertenece a ningún barrio.",
    },
    401: {
      description: "No autorizado o token JWT inválido.",
    },
    403: {
      description: "Acceso denegado. Solo líderes y miembros pueden acceder.",
    },
    404: {
      description: "Comité no encontrado para el barrio del usuario.",
    },
    500: {
      description: "Error interno del servidor.",
    },
  },
});


