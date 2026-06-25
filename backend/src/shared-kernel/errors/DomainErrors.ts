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

export class ProvinceNotFoundError extends DomainError {
  constructor(provinceId: number) {
    super(
      `La provincia con ID ${provinceId} no existe en el sistema.`,
      "PROVINCE_NOT_FOUND"
    );
  }
}

export class CityNotFoundError extends DomainError {
  constructor(cityId: number) {
    super(
      `La ciudad con ID ${cityId} no existe en el sistema.`,
      "CITY_NOT_FOUND"
    );
  }
}

export class CommitteeNotFoundError extends DomainError {
  constructor(barrioId: number) {
    super(
      `No se encontró un comité registrado para el barrio con ID ${barrioId}.`,
      "COMMITTEE_NOT_FOUND"
    );
  }
}

export class UserBarrioMismatchError extends DomainError {
  constructor(userId: number, leaderBarrioId: number) {
    super(
      `El usuario con ID ${userId} no pertenece al barrio del comité (ID Barrio: ${leaderBarrioId}).`,
      "USER_BARRIO_MISMATCH"
    );
  }
}

export class UserAlreadyInCommitteeError extends DomainError {
  constructor(userId: number) {
    super(
      `El usuario con ID ${userId} ya pertenece a la directiva de un comité.`,
      "USER_ALREADY_IN_COMMITTEE"
    );
  }
}
export class ReporteNotFoundError extends DomainError {
  constructor(reporteId: number) {
    super(
      `El reporte con ID ${reporteId} no existe en el sistema.`,
      "REPORTE_NOT_FOUND"
    );
  }
}

export class InvalidStateTransitionError extends DomainError {
  constructor(message: string) {
    super(message, "INVALID_STATE_TRANSITION");
  }
}


