export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidMoneyAmountError extends DomainError {}

export class InsufficientFundsError extends DomainError {}
