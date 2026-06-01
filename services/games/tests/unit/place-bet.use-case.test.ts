import { describe, expect, it } from "bun:test";
import { WalletReserveRequestedMessage } from "../../src/application/messages/wallet-reservation.messages";
import { GameRealtimePublisher } from "../../src/application/ports/game-realtime-publisher";
import { type WalletReservationPublisher } from "../../src/application/ports/wallet-reservation-publisher";
import { CurrentRoundService } from "../../src/application/services/current-round.service";
import { PlaceBetUseCase } from "../../src/application/use-cases/place-bet.use-case";
import { RequestWalletReservationUseCase } from "../../src/application/use-cases/request-wallet-reservation.use-case";
import { BetStatus } from "../../src/domain/entities/bet";
import { InvalidBetAmountError } from "../../src/domain/errors";

class FakeGameRealtimePublisher implements GameRealtimePublisher {
  events: string[] = [];

  publishRoundStarted(): void {
    this.events.push("round:started");
  }

  publishRoundMultiplier(): void {
    this.events.push("round:multiplier");
  }

  publishRoundCrashed(): void {
    this.events.push("round:crashed");
  }

  publishRoundSettled(): void {
    this.events.push("round:settled");
  }

  publishBetPlaced(): void {
    this.events.push("bet:placed");
  }

  publishBetCashedOut(): void {
    this.events.push("bet:cashedout");
  }
}

class FakeWalletReservationPublisher implements WalletReservationPublisher {
  published: WalletReserveRequestedMessage[] = [];

  async publish(message: WalletReserveRequestedMessage): Promise<void> {
    this.published.push(message);
  }
}

function createUseCase() {
  const realtime = new FakeGameRealtimePublisher();
  const publisher = new FakeWalletReservationPublisher();
  const requestWalletReservation = new RequestWalletReservationUseCase(publisher);
  const currentRound = new CurrentRoundService(undefined, realtime);
  const useCase = new PlaceBetUseCase(currentRound, requestWalletReservation, realtime);

  return { currentRound, publisher, realtime, useCase };
}

describe("PlaceBetUseCase", () => {
  it("places a bet and publishes a wallet reservation request", async () => {
    const { currentRound, publisher, realtime, useCase } = createUseCase();

    const result = await useCase.execute({
      playerId: "player",
      amountCents: 100n,
    });

    expect(result.playerId).toBe("player");
    expect(result.amountCents).toBe("100");
    expect(result.status).toBe(BetStatus.PLACED);
    expect(result.roundId).toBeString();
    expect(result.betId).toBeString();
    expect(publisher.published).toHaveLength(1);
    expect(publisher.published[0].playerId).toBe("player");
    expect(publisher.published[0].amountCents).toBe("100");
    expect(publisher.published[0].roundId).toBe(result.roundId);
    expect(publisher.published[0].betId).toBe(result.betId);
    expect(realtime.events).toContain("bet:placed");
    expect(realtime.events).toContain("round:started");
    currentRound.onModuleDestroy();
  });

  it("rejects a bet below the minimum amount", async () => {
    const { publisher, useCase } = createUseCase();

    await expect(
      useCase.execute({
        playerId: "player",
        amountCents: 99n,
      }),
    ).rejects.toThrow(InvalidBetAmountError);

    expect(publisher.published).toHaveLength(0);
  });

  it("rejects a bet above the maximum amount", async () => {
    const { publisher, useCase } = createUseCase();

    await expect(
      useCase.execute({
        playerId: "player",
        amountCents: 100_001n,
      }),
    ).rejects.toThrow(InvalidBetAmountError);

    expect(publisher.published).toHaveLength(0);
  });
});
