export class DomainError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class CommitteeAlreadyExistsError extends DomainError {
  constructor(barrioId: number) {
    super(
      `El comité barrial para el barrio con ID ${barrioId} ya ha sido registrado previamente.`,
      "COMMITTEE_ALREADY_EXISTS"
    );
  }
}

export class UsernameAlreadyTakenError extends DomainError {
  constructor(username: string) {
    super(
      `El nombre de usuario '${username}' ya se encuentra registrado.`,
      "USERNAME_ALREADY_TAKEN"
    );
  }
}

export class BarrioNotFoundError extends DomainError {
  constructor(barrioId: number) {
    super(
      `El barrio con ID ${barrioId} no existe en el sistema.`,
      "BARRIO_NOT_FOUND"
    );
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super(
      "Las credenciales proporcionadas no son válidas.",
      "INVALID_CREDENTIALS"
    );
  }
}

export class UserNotFoundError extends DomainError {
  constructor(identifier: string | number) {
    super(
      `El usuario con identificador '${identifier}' no fue encontrado en el sistema.`,
      "USER_NOT_FOUND"
    );
  }
}

