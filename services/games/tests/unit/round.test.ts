import { describe, expect, it } from "bun:test";
import { BetStatus } from "../../src/domain/bet";
import { InvalidBetActionError, InvalidBetAmountError, InvalidRoundTransitionError } from "../../src/domain/errors";
import { MAX_BET_CENTS, MIN_BET_CENTS, Round, RoundStatus } from "../../src/domain/round";

function createRound(): Round {
  return Round.create({
    id: "round-1",
    crashPoint: 250,
    serverSeedHash: "server-seed-hash",
    serverSeed: "server-seed",
    clientSeed: "client-seed",
    nonce: 1,
    bettingEndsAt: new Date("2026-05-31T12:00:00.000Z"),
  });
}

describe("Round", () => {
  it("creates a round in betting status", () => {
    const round = createRound();

    expect(round.id).toBe("round-1");
    expect(round.status).toBe(RoundStatus.BETTING);
    expect(round.crashPoint).toBe(250);
    expect(round.serverSeedHash).toBe("server-seed-hash");
    expect(round.serverSeed).toBe("server-seed");
    expect(round.clientSeed).toBe("client-seed");
    expect(round.nonce).toBe(1);
    expect(round.bets).toHaveLength(0);
  });

  it("accepts a valid bet during betting", () => {
    const round = createRound();

    const bet = round.placeBet({
      id: "bet-1",
      playerId: "player-1",
      amountCents: 10_00n,
    });

    expect(bet.roundId).toBe("round-1");
    expect(bet.status).toBe(BetStatus.PLACED);
    expect(round.bets).toHaveLength(1);
  });

  it("rejects bets outside the allowed limits", () => {
    const round = createRound();

    expect(() =>
      round.placeBet({
        id: "bet-1",
        playerId: "player-1",
        amountCents: MIN_BET_CENTS - 1n,
      }),
    ).toThrow(InvalidBetAmountError);

    expect(() =>
      round.placeBet({
        id: "bet-2",
        playerId: "player-2",
        amountCents: MAX_BET_CENTS + 1n,
      }),
    ).toThrow(InvalidBetAmountError);
  });

  it("rejects duplicate bets by the same player", () => {
    const round = createRound();

    round.placeBet({ id: "bet-1", playerId: "player-1", amountCents: 10_00n });

    expect(() => round.placeBet({ id: "bet-2", playerId: "player-1", amountCents: 20_00n })).toThrow(
      InvalidBetActionError,
    );
  });

  it("rejects bets when the round is running or crashed", () => {
    const runningRound = createRound();
    runningRound.start();

    expect(() => runningRound.placeBet({ id: "bet-1", playerId: "player-1", amountCents: 10_00n })).toThrow(
      InvalidBetActionError,
    );

    runningRound.crash();

    expect(() => runningRound.placeBet({ id: "bet-2", playerId: "player-2", amountCents: 10_00n })).toThrow(
      InvalidBetActionError,
    );
  });

  it("transitions through betting, running, crashed, and settled", () => {
    const round = createRound();

    round.start();
    expect(round.status).toBe(RoundStatus.RUNNING);

    round.crash();
    expect(round.status).toBe(RoundStatus.CRASHED);

    round.settle();
    expect(round.status).toBe(RoundStatus.SETTLED);
  });

  it("rejects invalid transitions", () => {
    const round = createRound();

    expect(() => round.crash()).toThrow(InvalidRoundTransitionError);
    expect(() => round.settle()).toThrow(InvalidRoundTransitionError);

    round.start();

    expect(() => round.start()).toThrow(InvalidRoundTransitionError);
  });

  it("allows cashout while running and calculates payout", () => {
    const round = createRound();
    round.placeBet({ id: "bet-1", playerId: "player-1", amountCents: 10_00n });
    round.start();

    const bet = round.cashout("player-1", 150);

    expect(bet.status).toBe(BetStatus.CASHED_OUT);
    expect(bet.payoutCents).toBe(15_00n);
  });

  it("rejects cashout outside running status or without a bet", () => {
    const round = createRound();

    expect(() => round.cashout("player-1", 150)).toThrow(InvalidBetActionError);

    round.start();

    expect(() => round.cashout("player-1", 150)).toThrow(InvalidBetActionError);
  });

  it("marks only pending bets as lost when crashing", () => {
    const round = createRound();
    const cashedOutBet = round.placeBet({ id: "bet-1", playerId: "player-1", amountCents: 10_00n });
    const pendingBet = round.placeBet({ id: "bet-2", playerId: "player-2", amountCents: 10_00n });

    round.start();
    round.cashout("player-1", 150);
    round.crash();

    expect(cashedOutBet.status).toBe(BetStatus.CASHED_OUT);
    expect(pendingBet.status).toBe(BetStatus.LOST);
  });
});
