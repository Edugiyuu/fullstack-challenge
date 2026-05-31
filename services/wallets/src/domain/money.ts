import { InvalidMoneyAmountError } from "./errors";

export class Money {
  private constructor(private readonly value: bigint) {}

  static fromCents(cents: bigint | number): Money {
    if (typeof cents === "number") {
      if (!Number.isSafeInteger(cents)) {
        throw new InvalidMoneyAmountError("Money amount must be a safe integer number of cents");
      }

      return Money.fromCents(BigInt(cents));
    }

    if (cents < 0n) {
      throw new InvalidMoneyAmountError("Money amount cannot be negative");
    }

    return new Money(cents);
  }

  get cents(): bigint {
    return this.value;
  }

  add(other: Money): Money {
    return Money.fromCents(this.value + other.value);
  }

  subtract(other: Money): Money {
    return Money.fromCents(this.value - other.value);
  }

  isLessThan(other: Money): boolean {
    return this.value < other.value;
  }
}
