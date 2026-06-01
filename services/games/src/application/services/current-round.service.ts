import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Bet } from "../../domain/entities/bet";
import { Round, RoundStatus } from "../../domain/entities/round";
import { ProvablyFair } from "../../domain/services/provably-fair";
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
  private ticker?: ReturnType<typeof setInterval>;

  constructor(private readonly requestWalletBetLost?: RequestWalletBetLostUseCase) {}

  onModuleDestroy(): void {
    this.stopTicker();
  }

  getCurrentRound(): Round {
    return this.getCurrentRoundState().round;
  }

  getCurrentRoundState(): { round: Round; currentMultiplier: number } {
    if (!this.currentRound || this.currentRound.status === RoundStatus.SETTLED) {
      this.currentRound = this.createDevelopmentRound();
      this.currentMultiplier = 100;
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

    this.currentMultiplier = 100;
    round.start();
    this.startTicker();
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

    if (this.currentMultiplier >= round.crashPoint) {
      this.currentMultiplier = round.crashPoint;
      const lostBets = round.crash();
      round.settle();
      this.stopTicker();
      await this.publishLostBets(lostBets);
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
