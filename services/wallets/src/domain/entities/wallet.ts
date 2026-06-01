import { InsufficientFundsError } from "../errors";
import { Money } from "../value-objects/money";

type WalletProps = {
  id: string;
  playerId: string;
  balance: Money;
  reserved: Money;
};

export class Wallet {
  private constructor(private readonly props: WalletProps) {}

  static create(params: { id: string; playerId: string; initialBalanceCents?: bigint | number }): Wallet {
    return new Wallet({
      id: params.id,
      playerId: params.playerId,
      balance: Money.fromCents(params.initialBalanceCents ?? 0n),
      reserved: Money.fromCents(0n),
    });
  }

  static rehydrate(params: {
    id: string;
    playerId: string;
    balanceCents: bigint | number;
    reservedCents: bigint | number;
  }): Wallet {
    return new Wallet({
      id: params.id,
      playerId: params.playerId,
      balance: Money.fromCents(params.balanceCents),
      reserved: Money.fromCents(params.reservedCents),
    });
  }

  get id(): string {
    return this.props.id;
  }

  get playerId(): string {
    return this.props.playerId;
  }

  get balanceCents(): bigint {
    return this.props.balance.cents;
  }

  get reservedCents(): bigint {
    return this.props.reserved.cents;
  }

  credit(amount: Money): void {
    this.props.balance = this.props.balance.add(amount);
  }

  debit(amount: Money): void {
    this.ensureAvailable(amount);
    this.props.balance = this.props.balance.subtract(amount);
  }

  reserve(amount: Money): void {
    this.ensureAvailable(amount);
    this.props.balance = this.props.balance.subtract(amount);
    this.props.reserved = this.props.reserved.add(amount);
  }

  release(amount: Money): void {
    if (this.props.reserved.isLessThan(amount)) {
      throw new InsufficientFundsError("Reserved balance is insufficient");
    }

    this.props.reserved = this.props.reserved.subtract(amount);
    this.props.balance = this.props.balance.add(amount);
  }

  private ensureAvailable(amount: Money): void {
    if (this.props.balance.isLessThan(amount)) {
      throw new InsufficientFundsError("Available balance is insufficient");
    }
  }
}
