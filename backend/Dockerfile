# --- STAGE 1: Construcción (Build) ---
# Usamos docker.io/library/node:24-alpine3.24 como base para compilar y preparar las dependencias.
FROM docker.io/library/node:24-alpine3.24 AS builder

WORKDIR /app

# Habilitamos Corepack para usar la versión de pnpm definida en el proyecto
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Copiamos los archivos de definición de dependencias y workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Instalamos las dependencias necesarias de manera limpia (respetando el lockfile)
RUN pnpm install --frozen-lockfile

# Copiamos todo el código fuente del backend
COPY . .


# --- STAGE 2: Ejecución (Run) ---
# Usamos la misma imagen docker.io/library/node:24-alpine3.24 para mantener la paridad y ligereza en ejecución.
FROM docker.io/library/node:24-alpine3.24 AS runner

WORKDIR /app

# Habilitamos Corepack también en la etapa de ejecución
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Copiamos el código fuente y las dependencias preparadas en el stage builder
COPY --from=builder /app /app

# Exponemos el puerto de desarrollo común (ajustable)
EXPOSE 3000

# Por defecto ejecutamos el script de desarrollo
CMD ["pnpm", "dev"]
