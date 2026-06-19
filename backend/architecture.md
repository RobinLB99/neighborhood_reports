# 🏛️ Backend Architecture Documentation

This document describes the architecture, design principles, and data flow for the platform's backend.

The project is designed to run in a **Serverless (Vercel Functions)** environment while maintaining a strict separation of concerns to avoid vendor lock-in. To achieve this, we merge three architectural patterns: **Screaming Architecture**, **Clean Architecture**, and **Hexagonal Architecture (Ports and Adapters)**.

---

## 1. Core Design Principles

1. **Framework Independence (Vendor Lock-in mitigation):** Vercel is treated purely as a delivery mechanism. The core business logic is unaware that it is running on Vercel, allowing for a transparent migration to a VPS, AWS Lambda, or a Docker container in the future.
2. **Screaming Architecture:** The top-level folder structure inside `src/` reveals the business domains (e.g., `worker-profile`, `identity-validation`), not the technical details (e.g., `controllers`, `models`).
3. **Dependency Rule (Clean Architecture):** Source code dependencies must only point inwards. Inner layers (Domain) must not know anything about outer layers (Databases, Vercel APIs, HTTP libraries).
4. **Serverless Optimization (Cold Starts):** By splitting the project vertically into use cases, each *Serverless Function* compiles and imports only the strictly necessary code, reducing cold start times to an absolute minimum.

---

## 2. Directory Structure (Isolated Repository)

The backend is managed as an autonomous project. Physically, it is split into two major blocks: the inbound infrastructure (`api/`) and the core business logic (`src/`).

```text
backend/
├── api/                                # 🟢 DRIVING ADAPTERS (Vercel Infrastructure)
│   ├── auth/                           # Endpoints: /api/auth/*
│   ├── workers/                        # Endpoints: /api/workers/*
│   └── verification/                   # Endpoints: /api/verification/*
│
├── src/                                # 🧠 APPLICATION CORE (Independent)
│   │
│   ├── authentication/                 # DOMAIN: Access and session
│   ├── worker-profile/                 # DOMINIO: Professionals catalog
│   ├── identity-validation/            # DOMINIO: Citizen security filter
│   ├── reviews-reputation/             # DOMINIO: Trust system (Ratings)
│   │
│   └── shared-kernel/                  # GLOBAL UTILITIES (Shared across domains)
│       ├── database/                   # Connection client (e.g., Pooler to Vercel Postgres)
│       ├── errors/                     # Custom domain exceptions
│       └── utils/                      # Transversal pure functions
│
├── vercel.json                         # Serverless provider configuration
└── package.json

```

---

## 3. Inner Domain Layers

Within each domain (for example, `src/worker-profile/`), the structure follows a rigid distribution into three concentric layers:

### 3.1. Domain (`/domain`) - *The Core*

Contains pure business rules. It has zero external dependencies.

* **Entities:** Objects with a unique identity (e.g., `Worker.ts`).
* **Value Objects:** Self-validating data without an identity of its own (e.g., `EcuadorPhone.ts`, `Rating.ts`).
* **Ports (Repositories/Gateways):** Interfaces that define outbound contracts (e.g., `WorkerRepository.interface.ts`).

### 3.2. Application (`/application`) - *Orchestration*

Coordinates logic between the domain and the ports.

* **Use Cases:** Classes or functions that execute a specific business action (e.g., `SearchWorkersByLocation.ts`).
* **DTOs (Data Transfer Objects):** Types that define what data enters and leaves the use case (Automatically inferred from Zod).

### 3.3. Infrastructure (`/infrastructure`) - *The Outer Layer*

Implements the interfaces (Ports) defined in the domain, interacting with the real world.

* **Database Adapters:** Repository implementations using **Drizzle ORM** for lightweight and type-safe queries (e.g., `DrizzleWorkerRepository.ts`).
* **External APIs:** Connection to third-party services (e.g., `RegistroCivilAdapter.ts`).
* **Mappers:** Map raw database rows into Domain Entities.

---

## 4. Request Lifecycle

All HTTP requests follow the Ports and Adapters (Hexagonal) pattern:

1. **Driving Adapter (`api/`):** The Vercel function intercepts the HTTP request. It extracts parameters (body, query, headers), instantiates the necessary dependencies, and calls the Use Case.
2. **Application (`src/.../use-cases/`):** The Use Case receives clean data (DTO). It applies the business logic by orchestrating Entities.
3. **Driven Port (`src/.../domain/repositories/`):** If the Use Case needs to persist or read data, it calls a Port (Interface), completely unaware of the underlying database.
4. **Driven Adapter (`src/.../infrastructure/database/`):** The concrete implementation of the port executes the query via Drizzle ORM and returns the result mapped as a Domain Entity.
5. **Response:** The Use Case returns the result to the Driving Adapter (`api/`), which formats it as JSON and sends it back to the HTTP client.

---

## 5. Technical Decisions and Tooling

* **Runtime:** Node.js (via Vercel Edge / Serverless Functions).
* **Language:** Strict TypeScript.
* **Database:** PostgreSQL (Vercel Postgres / Neon).
* **DB Queries:** **Drizzle ORM** (Chosen specifically for its minimal memory footprint, fast startup times in serverless environments, and native SQL compatibility).
* **Data Validation:** Zod (to validate and sanitize HTTP inputs in the primary adapters).
* **API Contracts (Frontend/Backend):** Endpoint specifications are exported at compile time to a static `openapi.json` file using `@asteasolutions/zod-to-openapi`. This allows the client to generate its types automatically without coupling the repositories.
