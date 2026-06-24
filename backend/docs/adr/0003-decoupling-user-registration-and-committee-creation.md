# ADR 0003: Decoupling of User Registration and Committee Creation

## Status
Accepted

## Context
In the initial implementation, the creation of a committee founder (the leader) and the creation of the committee itself were coupled into a single use case `RegisterFirstMemberUseCase` and endpoint `/api/committee/register-first`.
This approach had several architectural issues:
1. **Violation of Single Responsibility Principle (SRP):** The committee domain was responsible for creating user credentials, hashing passwords, and validating user structures.
2. **Lack of Extensibility:** Other registration flows (e.g., registering a regular citizen or an ordinary member) could not reuse this logic without replicating code.
3. **Tight Coupling:** The committee infrastructure layer had to interact with the `usuarios` table directly for inserts, increasing the cognitive load of the committee module.

## Decision
We decided to decouple user registration from committee creation:
1. **Separate Authentication Domain:** We introduced `RegisterUserUseCase` and `RegisterUserDto` inside the `authentication` domain, exposing a public endpoint `POST /api/auth/register` to register users with the default role of `"ciudadano"`.
2. **Authenticated Committee Creation:** The `/api/committee/register-first` endpoint was modified to require JWT authentication (moving it out of `PUBLIC_PATHS` in the Vercel Edge Middleware).
3. **Implicit Role Promotion:** The committee creation flow now receives the `userId` of the authenticated user. Within a single transaction in the database infrastructure layer (`DrizzleCommitteeRepository`), the committee is created, the user is linked as `"Presidente"`, and their role in the `usuarios` table is atomically promoted from `"ciudadano"` to `"lider"`.

## Consequences

### Positive
- **Clean Separation of Concerns:** The committee domain is no longer responsible for password hashing or user creation validation.
- **Extensibility:** The system can now support generic user registrations under `/api/auth/register` for any role (e.g., citizens).
- **Security:** The committee creation endpoint is now securely hidden behind Vercel Edge Middleware JWT verification.
- **Transactional Integrity:** Role promotion and committee creation are completed atomically, avoiding orphaned records.

### Negative
- **API Contract Change (Breaking Change):** The frontend must now execute a two-step flow to register a founder (1. `/api/auth/register` -> 2. `/api/auth/login` -> 3. `/api/committee/register-first`).

## References
- User request: Decouple leader creation from committee creation.
- PR/Commit: Refactored DrizzleAuthRepository, RegisterFirstMemberUseCase, RegisterUserUseCase, and OpenAPI schemas.
