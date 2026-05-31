export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidBetAmountError extends DomainError {}

export class InvalidRoundTransitionError extends DomainError {}

export class InvalidBetActionError extends DomainError {}
