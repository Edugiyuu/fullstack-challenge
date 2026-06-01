import { Bet } from "./bet";
import { InvalidBetActionError, InvalidBetAmountError, InvalidRoundTransitionError } from "../errors";

export const RoundStatus = {
  BETTING: "BETTING",
  RUNNING: "RUNNING",
  CRASHED: "CRASHED",
  SETTLED: "SETTLED",
} as const;

export type RoundStatus = (typeof RoundStatus)[keyof typeof RoundStatus];

export const MIN_BET_CENTS = 100n;
export const MAX_BET_CENTS = 100_000n;

type RoundProps = {
  id: string;
  status: RoundStatus;
  crashPoint: number;
  serverSeedHash: string;
  serverSeed?: string;
  clientSeed?: string;
  nonce: number;
  bettingEndsAt: Date;
  bets: Bet[];
};

export class Round {
  private constructor(private readonly props: RoundProps) {}

  static create(params: {
    id: string;
    crashPoint: number;
    serverSeedHash: string;
    serverSeed?: string;
    clientSeed?: string;
    nonce: number;
    bettingEndsAt: Date;
  }): Round {
    return new Round({
      id: params.id,
      status: RoundStatus.BETTING,
      crashPoint: params.crashPoint,
      serverSeedHash: params.serverSeedHash,
      serverSeed: params.serverSeed,
      clientSeed: params.clientSeed,
      nonce: params.nonce,
      bettingEndsAt: params.bettingEndsAt,
      bets: [],
    });
  }

  get id(): string {
    return this.props.id;
  }

  get status(): RoundStatus {
    return this.props.status;
  }

  get crashPoint(): number {
    return this.props.crashPoint;
  }

  get serverSeedHash(): string {
    return this.props.serverSeedHash;
  }

  get serverSeed(): string | undefined {
    return this.props.serverSeed;
  }

  get clientSeed(): string | undefined {
    return this.props.clientSeed;
  }

  get nonce(): number {
    return this.props.nonce;
  }

  get bettingEndsAt(): Date {
    return this.props.bettingEndsAt;
  }

  get bets(): readonly Bet[] {
    return this.props.bets;
  }

  placeBet(params: { id: string; playerId: string; amountCents: bigint }): Bet {
    if (this.props.status !== RoundStatus.BETTING) {
      throw new InvalidBetActionError("Bets can only be placed during betting");
    }

    if (params.amountCents < MIN_BET_CENTS || params.amountCents > MAX_BET_CENTS) {
      throw new InvalidBetAmountError("Bet amount is outside allowed limits");
    }

    if (this.props.bets.some((bet) => bet.playerId === params.playerId && bet.status !== "REFUNDED")) {
      throw new InvalidBetActionError("Player already placed a bet in this round");
    }

    const bet = Bet.place({
      id: params.id,
      roundId: this.props.id,
      playerId: params.playerId,
      amountCents: params.amountCents,
    });

    this.props.bets.push(bet);
    return bet;
  }

  start(): void {
    this.transition(RoundStatus.BETTING, RoundStatus.RUNNING);
  }

  cashout(playerId: string, multiplier: number): Bet {
    if (this.props.status !== RoundStatus.RUNNING) {
      throw new InvalidBetActionError("Cashout can only happen while the round is running");
    }

    const bet = this.findBetByPlayer(playerId);
    bet.cashout(multiplier);
    return bet;
  }

  refundBet(betId: string): Bet {
    const bet = this.props.bets.find((currentBet) => currentBet.id === betId);

    if (!bet) {
      throw new InvalidBetActionError("Bet not found in this round");
    }

    bet.refund();
    return bet;
  }

  crash(): Bet[] {
    this.transition(RoundStatus.RUNNING, RoundStatus.CRASHED);
    const lostBets: Bet[] = [];

    for (const bet of this.props.bets) {
      try {
        bet.lose();
        lostBets.push(bet);
      } catch (error) {
        if (!(error instanceof InvalidBetActionError)) {
          throw error;
        }
      }
    }

    return lostBets;
  }

  settle(): void {
    this.transition(RoundStatus.CRASHED, RoundStatus.SETTLED);
  }

  private findBetByPlayer(playerId: string): Bet {
    const bet = this.props.bets.find((currentBet) => currentBet.playerId === playerId);

    if (!bet) {
      throw new InvalidBetActionError("Player has no bet in this round");
    }

    return bet;
  }

  private transition(from: RoundStatus, to: RoundStatus): void {
    if (this.props.status !== from) {
      throw new InvalidRoundTransitionError(`Round must be ${from} to transition to ${to}`);
    }

    this.props.status = to;
  }
}
