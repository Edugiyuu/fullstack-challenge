import { Inject, Injectable, Logger, OnModuleDestroy, Optional } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Bet } from "../../domain/entities/bet";
import { Round, RoundStatus } from "../../domain/entities/round";
import { ProvablyFair } from "../../domain/services/provably-fair";
import { GAME_REALTIME_PUBLISHER, type GameRealtimePublisher } from "../ports/game-realtime-publisher";
import { RequestWalletBetLostUseCase } from "../use-cases/request-wallet-bet-lost.use-case";

const DEVELOPMENT_CLIENT_SEED = "development-client-seed";
const BETTING_WINDOW_MS = 60_000;
const MULTIPLIER_STEP_CENTS = 10;
const TICK_MS = 200;

@Injectable()
export class CurrentRoundService implements OnModuleDestroy {
  private readonly logger = new Logger(CurrentRoundService.name);
  private currentRound: Round | null = null;
  private currentMultiplier = 100;
  private nextNonce = 1;
  private startTimer?: ReturnType<typeof setTimeout>;
  private ticker?: ReturnType<typeof setInterval>;

  constructor(
    @Optional()
    private readonly requestWalletBetLost?: RequestWalletBetLostUseCase,
    @Optional()
    @Inject(GAME_REALTIME_PUBLISHER)
    private readonly gameRealtime?: GameRealtimePublisher,
  ) {}

  onModuleDestroy(): void {
    this.stopStartTimer();
    this.stopTicker();
  }

  getCurrentRound(): Round {
    return this.getCurrentRoundState().round;
  }

  getCurrentRoundState(): { round: Round; currentMultiplier: number } {
    if (!this.currentRound || this.currentRound.status === RoundStatus.SETTLED) {
      this.currentRound = this.createDevelopmentRound();
      this.currentMultiplier = 100;
      this.scheduleCurrentRoundStart();
    }

    return {
      round: this.currentRound,
      currentMultiplier: this.currentMultiplier,
    };
  }

  startCurrentRound(): void {
    const round = this.getCurrentRound();

    if (round.status !== RoundStatus.BETTING) {
      return;
    }

    this.stopStartTimer();
    this.currentMultiplier = 100;
    round.start();
    this.gameRealtime?.publishRoundStarted(round, this.currentMultiplier);
    this.startTicker();
  }

  rejectBetReservation(params: { roundId: string; betId: string }): Bet | null {
    const round = this.currentRound;

    if (!round || round.id !== params.roundId) {
      return null;
    }

    const bet = round.refundBet(params.betId);
    this.gameRealtime?.publishBetRejected(bet);
    return bet;
  }

  private createDevelopmentRound(): Round {
    const nonce = this.nextNonce++;
    const serverSeed = `development-server-seed-${nonce}`;
    const serverSeedHash = ProvablyFair.hashServerSeed(serverSeed);
    const crashPoint = ProvablyFair.calculateCrashPoint({
      serverSeed,
      clientSeed: DEVELOPMENT_CLIENT_SEED,
      nonce,
    });

    return Round.create({
      id: randomUUID(),
      crashPoint,
      serverSeedHash,
      serverSeed,
      clientSeed: DEVELOPMENT_CLIENT_SEED,
      nonce,
      bettingEndsAt: new Date(Date.now() + BETTING_WINDOW_MS),
    });
  }

  private startTicker(): void {
    this.stopTicker();
    this.ticker = setInterval(() => void this.tick(), TICK_MS);
  }

  private scheduleCurrentRoundStart(): void {
    const round = this.currentRound;

    if (!round || round.status !== RoundStatus.BETTING) {
      return;
    }

    this.stopStartTimer();
    const delayMs = Math.max(0, round.bettingEndsAt.getTime() - Date.now());
    this.startTimer = setTimeout(() => this.startCurrentRound(), delayMs);
  }

  private stopStartTimer(): void {
    if (this.startTimer) {
      clearTimeout(this.startTimer);
      this.startTimer = undefined;
    }
  }

  private stopTicker(): void {
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = undefined;
    }
  }

  private async tick(): Promise<void> {
    const round = this.currentRound;

    if (!round || round.status !== RoundStatus.RUNNING) {
      this.stopTicker();
      return;
    }

    this.currentMultiplier += MULTIPLIER_STEP_CENTS;
    this.gameRealtime?.publishRoundMultiplier(round, this.currentMultiplier);

    if (this.currentMultiplier >= round.crashPoint) {
      this.currentMultiplier = round.crashPoint;
      const lostBets = round.crash();
      this.gameRealtime?.publishRoundCrashed(round, this.currentMultiplier, lostBets);
      round.settle();
      this.gameRealtime?.publishRoundSettled(round, this.currentMultiplier);
      this.stopTicker();
      await this.publishLostBets(lostBets);
      this.currentRound = this.createDevelopmentRound();
      this.currentMultiplier = 100;
      this.scheduleCurrentRoundStart();
    }
  }

  private async publishLostBets(lostBets: Bet[]): Promise<void> {
    if (!this.requestWalletBetLost) {
      return;
    }

    for (const bet of lostBets) {
      try {
        await this.requestWalletBetLost.execute({
          playerId: bet.playerId,
          roundId: bet.roundId,
          betId: bet.id,
          amountCents: bet.amountCents,
        });
      } catch (error) {
        this.logger.error("Failed to publish lost bet settlement", error);
      }
    }
  }
}
