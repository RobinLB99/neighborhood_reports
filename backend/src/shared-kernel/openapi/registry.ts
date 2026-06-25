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
import { CreateReportPayloadSchema } from "../../incidents/domain/entities/Reporte.js";
import { IncidentSupportParamsSchema, SupportStatsResponseSchema } from "../../incidents/domain/entities/Apoyo.js";
import { AddCommentParamsSchema, CreateCommentPayloadSchema } from "../../incidents/domain/entities/Comentario.js";
import { CreateGestionParamsSchema, CreateGestionPayloadSchema } from "../../incidents/domain/entities/GestionAdministrativa.js";


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

// Nuevos esquemas para firmas de almacenamiento e incidencias
const StorageSignatureResponseSchema = registry.register("StorageSignatureResponse", z.object({
  message: z.string(),
  data: z.object({
    signature: z.string(),
    timestamp: z.number(),
    folder: z.string(),
    apiKey: z.string(),
    cloudName: z.string(),
  }),
}));

const CreateReportResponseSchema = registry.register("CreateReportResponse", z.object({
  message: z.string(),
  data: z.object({
    id: z.number(),
    usuarioId: z.number(),
    barrioId: z.number(),
    direccion: z.string(),
    ubicacion: z.string(),
    fotoUrl: z.string(),
    estado: z.string(),
    descripcion: z.string(),
    fechaCreacion: z.string().optional(),
  }),
}));

// Registrar Nuevas Rutas (Endpoints)
registry.registerPath({
  method: "get",
  path: "/api/storage/signature",
  summary: "Obtener firma para subida directa de imágenes",
  description: "Genera una firma criptográfica para permitir al frontend subir imágenes directamente a Cloudinary.",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      folder: z.string().optional().openapi({ description: "Carpeta de destino en Cloudinary" }),
    }),
  },
  responses: {
    200: {
      description: "Firma de Cloudinary generada con éxito.",
      content: {
        "application/json": {
          schema: StorageSignatureResponseSchema,
        },
      },
    },
    401: {
      description: "No autorizado o token JWT inválido.",
    },
    500: {
      description: "Error interno del servidor.",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/incidents/create",
  summary: "Crear reporte de incidencia",
  description: "Permite registrar un reporte de incidencia ciudadana en el barrio del usuario autenticado.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateReportPayloadSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Reporte de incidencia registrado exitosamente.",
      content: {
        "application/json": {
          schema: CreateReportResponseSchema,
        },
      },
    },
    400: {
      description: "El payload enviado contiene errores de validación.",
    },
    401: {
      description: "No autorizado o token JWT inválido.",
    },
    500: {
      description: "Error interno del servidor.",
    },
  },
});

const IncidentSchema = z.object({
  id: z.number(),
  usuarioId: z.number(),
  barrioId: z.number(),
  direccion: z.string(),
  ubicacion: z.string(),
  fotoUrl: z.string(),
  estado: z.string(),
  descripcion: z.string(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
});

const ListReportsResponseSchema = registry.register("ListReportsResponse", z.object({
  message: z.string(),
  data: z.array(IncidentSchema),
}));

registry.registerPath({
  method: "get",
  path: "/api/incidents/list",
  summary: "Listar reportes del barrio",
  description: "Recupera los reportes barriales filtrados por estado para el barrio del usuario autenticado (cualquier rol).",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      status: z.enum(["pendiente", "en_gestion", "solucionado", "all"]).optional().openapi({ description: "Filtrar por estado del reporte" }),
    }),
  },
  responses: {
    200: {
      description: "Listado de reportes recuperado con éxito.",
      content: {
        "application/json": {
          schema: ListReportsResponseSchema,
        },
      },
    },
    401: {
      description: "No autorizado o token JWT inválido.",
    },
    500: {
      description: "Error interno del servidor.",
    },
  },
});

// Registrar esquemas de apoyos
const ToggleSupportResponseSchema = registry.register("ToggleSupportResponse", z.object({
  message: z.string(),
  data: z.object({
    supported: z.boolean(),
  }),
}));

const SupportStatsResponseSchemaRegistered = registry.register(
  "SupportStatsResponse",
  SupportStatsResponseSchema
);

const CommentItemSchema = z.object({
  id: z.number(),
  reporteId: z.number(),
  usuarioId: z.number(),
  mensaje: z.string(),
  fechaCreacion: z.string().optional(),
});

const CreateCommentResponseSchema = registry.register("CreateCommentResponse", z.object({
  message: z.string(),
  data: CommentItemSchema,
}));

const ListCommentsResponseSchema = registry.register("ListCommentsResponse", z.object({
  message: z.string(),
  data: z.array(CommentItemSchema),
}));

// Registrar rutas de apoyos
registry.registerPath({
  method: "post",
  path: "/api/incidents/{id}/supports",
  summary: "Alternar apoyo a reporte (Corazón)",
  description: "Registra o elimina un apoyo (like) en el reporte especificado por ID para el usuario autenticado.",
  security: [{ bearerAuth: [] }],
  request: {
    params: IncidentSupportParamsSchema,
  },
  responses: {
    200: {
      description: "Apoyo alternado con éxito.",
      content: {
        "application/json": {
          schema: ToggleSupportResponseSchema,
        },
      },
    },
    400: {
      description: "ID de reporte inválido o erróneo.",
    },
    401: {
      description: "No autorizado o token JWT inválido.",
    },
    404: {
      description: "Reporte no encontrado en el sistema.",
    },
    500: {
      description: "Error interno del servidor.",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/incidents/{id}/supports",
  summary: "Obtener estadísticas de apoyos de un reporte",
  description: "Recupera la cantidad total de apoyos y si el usuario autenticado lo ha apoyado.",
  security: [{ bearerAuth: [] }],
  request: {
    params: IncidentSupportParamsSchema,
  },
  responses: {
    200: {
      description: "Estadísticas de apoyos recuperadas con éxito.",
      content: {
        "application/json": {
          schema: SupportStatsResponseSchemaRegistered,
        },
      },
    },
    400: {
      description: "ID de reporte inválido o erróneo.",
    },
    401: {
      description: "No autorizado o token JWT inválido.",
    },
    404: {
      description: "Reporte no encontrado en el sistema.",
    },
    500: {
      description: "Error interno del servidor.",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/incidents/{id}/comments",
  summary: "Registrar comentario en reporte",
  description: "Registra un comentario en el reporte especificado por ID para el usuario autenticado.",
  security: [{ bearerAuth: [] }],
  request: {
    params: AddCommentParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: CreateCommentPayloadSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Comentario registrado con éxito.",
      content: {
        "application/json": {
          schema: CreateCommentResponseSchema,
        },
      },
    },
    400: {
      description: "Payload o ID de reporte inválido.",
    },
    401: {
      description: "No autorizado o token JWT inválido.",
    },
    404: {
      description: "Reporte no encontrado en el sistema.",
    },
    500: {
      description: "Error interno del servidor.",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/incidents/{id}/comments",
  summary: "Obtener comentarios de un reporte",
  description: "Recupera la lista de comentarios de un reporte de incidencia específico. Solo accesible para líderes y miembros.",
  security: [{ bearerAuth: [] }],
  request: {
    params: AddCommentParamsSchema,
  },
  responses: {
    200: {
      description: "Listado de comentarios recuperado con éxito.",
      content: {
        "application/json": {
          schema: ListCommentsResponseSchema,
        },
      },
    },
    400: {
      description: "ID de reporte inválido.",
    },
    401: {
      description: "No autorizado o token JWT inválido.",
    },
    403: {
      description: "Acceso denegado. Solo líderes y miembros pueden acceder.",
    },
    404: {
      description: "Reporte no encontrado en el sistema.",
    },
    500: {
      description: "Error interno del servidor.",
    },
  },
});

const CreateGestionResponseSchema = registry.register("CreateGestionResponse", z.object({
  message: z.string(),
  data: z.object({
    id: z.number(),
    reporteId: z.number(),
    liderId: z.number(),
    estadoAsignado: z.string(),
    mensaje: z.string(),
    fechaGestion: z.string().optional(),
  }),
}));

const GestionItemSchema = z.object({
  id: z.number(),
  reporteId: z.number(),
  liderId: z.number(),
  nombreLider: z.string().optional(),
  estadoAsignado: z.string(),
  mensaje: z.string(),
  fechaGestion: z.string().optional(),
});

const ListGestionesResponseSchema = registry.register("ListGestionesResponse", z.object({
  message: z.string(),
  data: z.array(GestionItemSchema),
}));


registry.registerPath({
  method: "post",
  path: "/api/incidents/{id}/management",
  summary: "Registrar gestión administrativa en reporte",
  description: "Registra una acción de gestión (cambio de estado y bitácora) en el reporte especificado por ID. Solo accesible para líderes y miembros.",
  security: [{ bearerAuth: [] }],
  request: {
    params: CreateGestionParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: CreateGestionPayloadSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Gestión administrativa registrada con éxito.",
      content: {
        "application/json": {
          schema: CreateGestionResponseSchema,
        },
      },
    },
    400: {
      description: "Payload, ID de reporte inválido, o transición de estado inválida.",
    },
    401: {
      description: "No autorizado o token JWT inválido.",
    },
    403: {
      description: "Acceso denegado. Solo líderes y miembros de la directiva pueden realizar esta acción.",
    },
    404: {
      description: "Reporte no encontrado en el sistema.",
    },
    500: {
      description: "Error interno del servidor.",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/incidents/{id}/management",
  summary: "Obtener historial de gestiones de un reporte",
  description: "Recupera la lista de gestiones administrativas asociadas a un reporte. Solo accesible para líderes y miembros de la directiva.",
  security: [{ bearerAuth: [] }],
  request: {
    params: CreateGestionParamsSchema,
  },
  responses: {
    200: {
      description: "Historial de gestiones recuperado con éxito.",
      content: {
        "application/json": {
          schema: ListGestionesResponseSchema,
        },
      },
    },
    400: {
      description: "ID de reporte inválido.",
    },
    401: {
      description: "No autorizado o token JWT inválido.",
    },
    403: {
      description: "Acceso denegado. Solo líderes y miembros de la directiva pueden acceder.",
    },
    404: {
      description: "Reporte no encontrado en el sistema.",
    },
    500: {
      description: "Error interno del servidor.",
    },
  },
});

const DeleteIncidentResponseSchema = registry.register("DeleteIncidentResponse", z.object({
  message: z.string(),
}));

registry.registerPath({
  method: "delete",
  path: "/api/incidents/{id}/delete",
  summary: "Eliminación lógica de un reporte",
  description: "Realiza el borrado lógico de un reporte de incidencia. Los líderes y miembros pueden eliminar cualquier reporte. Los ciudadanos solo pueden eliminar sus propios reportes.",
  security: [{ bearerAuth: [] }],
  request: {
    params: CreateGestionParamsSchema,
  },
  responses: {
    200: {
      description: "Reporte eliminado exitosamente.",
      content: {
        "application/json": {
          schema: DeleteIncidentResponseSchema,
        },
      },
    },
    400: {
      description: "ID de reporte inválido.",
    },
    401: {
      description: "No autorizado o token JWT inválido.",
    },
    403: {
      description: "Acceso denegado. El usuario no posee permisos para eliminar este reporte.",
    },
    404: {
      description: "Reporte no encontrado en el sistema o ya inactivo.",
    },
    500: {
      description: "Error interno del servidor.",
    },
  },
});







