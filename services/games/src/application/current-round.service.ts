import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { ProvablyFair } from "../domain/provably-fair";
import { Round } from "../domain/round";

const DEVELOPMENT_CLIENT_SEED = "development-client-seed";
const BETTING_WINDOW_MS = 60_000;

@Injectable()
export class CurrentRoundService {
  private currentRound: Round | null = null;
  private nextNonce = 1;

  getCurrentRound(): Round {
    if (!this.currentRound) {
      this.currentRound = this.createDevelopmentRound();
    }

    return this.currentRound;
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
}
