import { describe, expect, it } from "bun:test";
import { WalletCashoutRequestedMessage } from "../../src/application/messages/wallet-reservation.messages";
import { type WalletSettlementPublisher } from "../../src/application/ports/wallet-settlement-publisher";
import { CurrentRoundService } from "../../src/application/services/current-round.service";
import { CashoutBetUseCase } from "../../src/application/use-cases/cashout-bet.use-case";
import { RequestWalletCashoutUseCase } from "../../src/application/use-cases/request-wallet-cashout.use-case";
import { BetStatus } from "../../src/domain/entities/bet";
import { InvalidBetActionError } from "../../src/domain/errors";

class FakeWalletSettlementPublisher implements WalletSettlementPublisher {
  cashouts: WalletCashoutRequestedMessage[] = [];

  async publishBetLost(): Promise<void> {}

  async publishCashout(message: WalletCashoutRequestedMessage): Promise<void> {
    this.cashouts.push(message);
  }
}

function createUseCase() {
  const currentRound = new CurrentRoundService();
  const publisher = new FakeWalletSettlementPublisher();
  const requestWalletCashout = new RequestWalletCashoutUseCase(publisher);
  const useCase = new CashoutBetUseCase(currentRound, requestWalletCashout);

  return { currentRound, publisher, useCase };
}

describe("CashoutBetUseCase", () => {
  it("cashs out a running bet and publishes wallet settlement", async () => {
    const { currentRound, publisher, useCase } = createUseCase();
    const round = currentRound.getCurrentRound();
    const bet = round.placeBet({ id: "bet-1", playerId: "player", amountCents: 100n });
    currentRound.startCurrentRound();

    const result = await useCase.execute({ playerId: "player" });

    expect(result.roundId).toBe(round.id);
    expect(result.betId).toBe(bet.id);
    expect(result.status).toBe(BetStatus.CASHED_OUT);
    expect(result.payoutCents).toBe("100");
    expect(publisher.cashouts).toHaveLength(1);
    expect(publisher.cashouts[0].reservedAmountCents).toBe("100");
    expect(publisher.cashouts[0].payoutCents).toBe("100");
    currentRound.onModuleDestroy();
  });

  it("rejects cashout when the round is not running", async () => {
    const { currentRound, publisher, useCase } = createUseCase();
    currentRound.getCurrentRound().placeBet({ id: "bet-1", playerId: "player", amountCents: 100n });

    await expect(useCase.execute({ playerId: "player" })).rejects.toThrow(InvalidBetActionError);
    expect(publisher.cashouts).toHaveLength(0);
  });
});
