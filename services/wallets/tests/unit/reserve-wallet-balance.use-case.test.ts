import { describe, expect, it } from "bun:test";
import { ReserveWalletBalanceUseCase } from "../../src/application/reserve-wallet-balance.use-case";
import { type WalletRepository } from "../../src/application/wallet-repository";
import { Wallet } from "../../src/domain/wallet";

class FakeWalletRepository implements WalletRepository {
  private wallet: Wallet | null;

  constructor(wallet: Wallet | null) {
    this.wallet = wallet;
  }

  async findByPlayerId(): Promise<Wallet | null> {
    return this.wallet;
  }

  async save(wallet: Wallet): Promise<void> {
    this.wallet = wallet;
  }
}

describe("ReserveWalletBalanceUseCase", () => {
  it("reserves balance when the wallet has sufficient funds", async () => {
    const wallet = Wallet.create({
      id: "wallet-1",
      playerId: "player-1",
      initialBalanceCents: 10_00n,
    });
    const useCase = new ReserveWalletBalanceUseCase(new FakeWalletRepository(wallet));

    const result = await useCase.execute({
      idempotencyKey: "round-1:bet-1:reserve",
      playerId: "player-1",
      roundId: "round-1",
      betId: "bet-1",
      amountCents: "400",
    });

    expect(result.status).toBe("succeeded");
    expect(result.idempotencyKey).toBe("round-1:bet-1:reserve");
    expect(wallet.balanceCents).toBe(6_00n);
    expect(wallet.reservedCents).toBe(4_00n);
  });

  it("fails when the wallet has insufficient funds", async () => {
    const wallet = Wallet.create({
      id: "wallet-1",
      playerId: "player-1",
      initialBalanceCents: 1_00n,
    });
    const useCase = new ReserveWalletBalanceUseCase(new FakeWalletRepository(wallet));

    const result = await useCase.execute({
      idempotencyKey: "round-1:bet-1:reserve",
      playerId: "player-1",
      roundId: "round-1",
      betId: "bet-1",
      amountCents: "101",
    });

    expect(result).toEqual({
      status: "failed",
      idempotencyKey: "round-1:bet-1:reserve",
      playerId: "player-1",
      roundId: "round-1",
      betId: "bet-1",
      amountCents: "101",
      reason: "INSUFFICIENT_FUNDS",
    });
  });

  it("fails when the wallet is not found", async () => {
    const useCase = new ReserveWalletBalanceUseCase(new FakeWalletRepository(null));

    const result = await useCase.execute({
      idempotencyKey: "round-1:bet-1:reserve",
      playerId: "player-1",
      roundId: "round-1",
      betId: "bet-1",
      amountCents: "100",
    });

    expect(result).toEqual({
      status: "failed",
      idempotencyKey: "round-1:bet-1:reserve",
      playerId: "player-1",
      roundId: "round-1",
      betId: "bet-1",
      amountCents: "100",
      reason: "WALLET_NOT_FOUND",
    });
  });
});
