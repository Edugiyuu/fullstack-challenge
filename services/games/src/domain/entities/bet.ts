import { InvalidBetActionError } from "../errors";

export const BetStatus = {
  PLACED: "PLACED",
  CASHED_OUT: "CASHED_OUT",
  LOST: "LOST",
  REFUNDED: "REFUNDED",
} as const;

export type BetStatus = (typeof BetStatus)[keyof typeof BetStatus];

type BetProps = {
  id: string;
  roundId: string;
  playerId: string;
  amountCents: bigint;
  status: BetStatus;
  cashoutMultiplier?: number;
  payoutCents?: bigint;
};

export class Bet {
  private constructor(private readonly props: BetProps) {}

  static place(params: { id: string; roundId: string; playerId: string; amountCents: bigint }): Bet {
    return new Bet({
      id: params.id,
      roundId: params.roundId,
      playerId: params.playerId,
      amountCents: params.amountCents,
      status: BetStatus.PLACED,
    });
  }

  get id(): string {
    return this.props.id;
  }

  get roundId(): string {
    return this.props.roundId;
  }

  get playerId(): string {
    return this.props.playerId;
  }

  get amountCents(): bigint {
    return this.props.amountCents;
  }

  get status(): BetStatus {
    return this.props.status;
  }

  get cashoutMultiplier(): number | undefined {
    return this.props.cashoutMultiplier;
  }

  get payoutCents(): bigint | undefined {
    return this.props.payoutCents;
  }

  cashout(multiplier: number): void {
    if (this.props.status !== BetStatus.PLACED) {
      throw new InvalidBetActionError("Only placed bets can be cashed out");
    }

    this.props.status = BetStatus.CASHED_OUT;
    this.props.cashoutMultiplier = multiplier;
    this.props.payoutCents = (this.props.amountCents * BigInt(multiplier)) / 100n;
  }

  lose(): void {
    if (this.props.status !== BetStatus.PLACED) {
      throw new InvalidBetActionError("Only placed bets can be lost");
    }

    this.props.status = BetStatus.LOST;
  }

  refund(): void {
    if (this.props.status !== BetStatus.PLACED) {
      throw new InvalidBetActionError("Only placed bets can be refunded");
    }

    this.props.status = BetStatus.REFUNDED;
  }
}
