export type Round = {
  id: string;
  status: string;
  crashPoint: number;
  currentMultiplier: number;
  bettingEndsAt?: string;
  bets: LiveBet[];
};

export type LiveBet = {
  id?: string;
  betId?: string;
  playerId: string;
  amountCents: string;
  status: string;
  cashoutMultiplier?: number;
  payoutCents?: string;
};

export type BetResult = {
  roundId: string;
  betId: string;
  playerId: string;
  amountCents: string;
  status: string;
};

export type CashoutResult = BetResult & {
  cashoutMultiplier: number;
  payoutCents: string;
};
