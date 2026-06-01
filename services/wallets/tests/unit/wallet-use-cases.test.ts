import { describe, expect, it } from "bun:test";
import { CreateWalletUseCase, DEFAULT_INITIAL_BALANCE_CENTS } from "../../src/application/create-wallet.use-case";
import { GetWalletUseCase } from "../../src/application/get-wallet.use-case";
import { Wallet } from "../../src/domain/wallet";

class FakeWalletRepository {
  readonly walletsByPlayerId = new Map<string, Wallet>();

  async findByPlayerId(playerId: string): Promise<Wallet | null> {
    return this.walletsByPlayerId.get(playerId) ?? null;
  }

  async save(wallet: Wallet): Promise<void> {
    this.walletsByPlayerId.set(wallet.playerId, wallet);
  }
}

describe("Wallet use cases", () => {
  it("creates a wallet with the development initial balance", async () => {
    const repository = new FakeWalletRepository();
    const useCase = new CreateWalletUseCase(repository);

    const wallet = await useCase.execute("player");

    expect(wallet.playerId).toBe("player");
    expect(wallet.balanceCents).toBe(DEFAULT_INITIAL_BALANCE_CENTS);
    expect(wallet.reservedCents).toBe(0n);
    expect(repository.walletsByPlayerId.size).toBe(1);
  });

  it("does not duplicate an existing wallet for the same player", async () => {
    const repository = new FakeWalletRepository();
    const useCase = new CreateWalletUseCase(repository);

    const firstWallet = await useCase.execute("player");
    const secondWallet = await useCase.execute("player");

    expect(secondWallet.id).toBe(firstWallet.id);
    expect(repository.walletsByPlayerId.size).toBe(1);
  });

  it("gets an existing wallet", async () => {
    const repository = new FakeWalletRepository();
    const wallet = Wallet.create({ id: "wallet-1", playerId: "player", initialBalanceCents: 10_00n });
    await repository.save(wallet);
    const useCase = new GetWalletUseCase(repository);

    const foundWallet = await useCase.execute("player");

    expect(foundWallet?.id).toBe("wallet-1");
    expect(foundWallet?.balanceCents).toBe(10_00n);
  });
});
