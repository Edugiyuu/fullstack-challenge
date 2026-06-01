import { describe, expect, it } from "bun:test";
import { WalletReserveRequestedMessage } from "../../src/application/messages/wallet-reservation.messages";
import { type WalletReservationPublisher } from "../../src/application/ports/wallet-reservation-publisher";
import { CurrentRoundService } from "../../src/application/services/current-round.service";
import { PlaceBetUseCase } from "../../src/application/use-cases/place-bet.use-case";
import { RequestWalletReservationUseCase } from "../../src/application/use-cases/request-wallet-reservation.use-case";
import { BetStatus } from "../../src/domain/entities/bet";
import { InvalidBetAmountError } from "../../src/domain/errors";

class FakeWalletReservationPublisher implements WalletReservationPublisher {
  published: WalletReserveRequestedMessage[] = [];

  async publish(message: WalletReserveRequestedMessage): Promise<void> {
    this.published.push(message);
  }
}

function createUseCase() {
  const publisher = new FakeWalletReservationPublisher();
  const requestWalletReservation = new RequestWalletReservationUseCase(publisher);
  const useCase = new PlaceBetUseCase(new CurrentRoundService(), requestWalletReservation);

  return { publisher, useCase };
}

describe("PlaceBetUseCase", () => {
  it("places a bet and publishes a wallet reservation request", async () => {
    const { publisher, useCase } = createUseCase();

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
