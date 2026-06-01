import { describe, expect, it } from "bun:test";
import { RequestWalletReservationUseCase } from "../../src/application/request-wallet-reservation.use-case";
import { WalletReserveRequestedMessage } from "../../src/application/messages";
import { type WalletReservationPublisher } from "../../src/application/wallet-reservation-publisher";

class FakeWalletReservationPublisher implements WalletReservationPublisher {
  published?: WalletReserveRequestedMessage;

  async publish(message: WalletReserveRequestedMessage): Promise<void> {
    this.published = message;
  }
}

describe("RequestWalletReservationUseCase", () => {
  it("publishes a wallet reservation request with amount cents as a string", async () => {
    const publisher = new FakeWalletReservationPublisher();
    const useCase = new RequestWalletReservationUseCase(publisher);

    const message = await useCase.execute({
      playerId: "player-1",
      roundId: "round-1",
      betId: "bet-1",
      amountCents: 10_00n,
    });

    expect(publisher.published).toEqual(message);
    expect(message.playerId).toBe("player-1");
    expect(message.roundId).toBe("round-1");
    expect(message.betId).toBe("bet-1");
    expect(message.amountCents).toBe("1000");
    expect(message.idempotencyKey).toBe("round-1:bet-1:reserve");
    expect(message.messageId).toBeString();
    expect(message.occurredAt).toBeString();
  });
});
