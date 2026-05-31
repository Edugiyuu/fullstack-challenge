import { describe, expect, it } from "bun:test";
import { InsufficientFundsError, InvalidMoneyAmountError } from "../../src/domain/errors";
import { Money } from "../../src/domain/money";
import { Wallet } from "../../src/domain/wallet";

describe("Wallet", () => {
  it("creates a wallet with an initial balance in cents", () => {
    const wallet = Wallet.create({
      id: "wallet-1",
      playerId: "player-1",
      initialBalanceCents: 10_00n,
    });

    expect(wallet.id).toBe("wallet-1");
    expect(wallet.playerId).toBe("player-1");
    expect(wallet.balanceCents).toBe(10_00n);
    expect(wallet.reservedCents).toBe(0n);
  });

  it("credits the available balance", () => {
    const wallet = Wallet.create({ id: "wallet-1", playerId: "player-1", initialBalanceCents: 10_00n });

    wallet.credit(Money.fromCents(2_50n));

    expect(wallet.balanceCents).toBe(12_50n);
  });

  it("debits the available balance", () => {
    const wallet = Wallet.create({ id: "wallet-1", playerId: "player-1", initialBalanceCents: 10_00n });

    wallet.debit(Money.fromCents(3_25n));

    expect(wallet.balanceCents).toBe(6_75n);
  });

  it("rejects debits when the available balance is insufficient", () => {
    const wallet = Wallet.create({ id: "wallet-1", playerId: "player-1", initialBalanceCents: 1_00n });

    expect(() => wallet.debit(Money.fromCents(1_01n))).toThrow(InsufficientFundsError);
    expect(wallet.balanceCents).toBe(1_00n);
  });

  it("reserves available balance for a bet", () => {
    const wallet = Wallet.create({ id: "wallet-1", playerId: "player-1", initialBalanceCents: 10_00n });

    wallet.reserve(Money.fromCents(4_00n));

    expect(wallet.balanceCents).toBe(6_00n);
    expect(wallet.reservedCents).toBe(4_00n);
  });

  it("prevents available and reserved balances from becoming negative", () => {
    const wallet = Wallet.create({ id: "wallet-1", playerId: "player-1", initialBalanceCents: 5_00n });

    expect(() => wallet.reserve(Money.fromCents(5_01n))).toThrow(InsufficientFundsError);
    expect(() => wallet.release(Money.fromCents(1n))).toThrow(InsufficientFundsError);
    expect(wallet.balanceCents).toBe(5_00n);
    expect(wallet.reservedCents).toBe(0n);
  });

  it("accepts only integer cents for money amounts", () => {
    expect(() => Money.fromCents(10.99)).toThrow(InvalidMoneyAmountError);
    expect(() => Money.fromCents(-1n)).toThrow(InvalidMoneyAmountError);
    expect(Money.fromCents(10_99n).cents).toBe(10_99n);
  });
});
