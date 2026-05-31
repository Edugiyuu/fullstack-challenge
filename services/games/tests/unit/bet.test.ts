import { describe, expect, it } from "bun:test";
import { Bet, BetStatus } from "../../src/domain/bet";
import { InvalidBetActionError } from "../../src/domain/errors";

describe("Bet", () => {
  it("creates a placed bet", () => {
    const bet = Bet.place({
      id: "bet-1",
      roundId: "round-1",
      playerId: "player-1",
      amountCents: 10_00n,
    });

    expect(bet.id).toBe("bet-1");
    expect(bet.roundId).toBe("round-1");
    expect(bet.playerId).toBe("player-1");
    expect(bet.amountCents).toBe(10_00n);
    expect(bet.status).toBe(BetStatus.PLACED);
  });

  it("calculates cashout payout using multiplier cents", () => {
    const bet = Bet.place({
      id: "bet-1",
      roundId: "round-1",
      playerId: "player-1",
      amountCents: 10_00n,
    });

    bet.cashout(250);

    expect(bet.status).toBe(BetStatus.CASHED_OUT);
    expect(bet.cashoutMultiplier).toBe(250);
    expect(bet.payoutCents).toBe(25_00n);
  });

  it("prevents cashout twice", () => {
    const bet = Bet.place({
      id: "bet-1",
      roundId: "round-1",
      playerId: "player-1",
      amountCents: 10_00n,
    });

    bet.cashout(150);

    expect(() => bet.cashout(200)).toThrow(InvalidBetActionError);
  });

  it("marks a placed bet as lost", () => {
    const bet = Bet.place({
      id: "bet-1",
      roundId: "round-1",
      playerId: "player-1",
      amountCents: 10_00n,
    });

    bet.lose();

    expect(bet.status).toBe(BetStatus.LOST);
  });

  it("prevents a cashed out bet from being lost", () => {
    const bet = Bet.place({
      id: "bet-1",
      roundId: "round-1",
      playerId: "player-1",
      amountCents: 10_00n,
    });

    bet.cashout(150);

    expect(() => bet.lose()).toThrow(InvalidBetActionError);
    expect(bet.status).toBe(BetStatus.CASHED_OUT);
  });
});
