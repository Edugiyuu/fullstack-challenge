import { Bet } from "../../domain/entities/bet";
import { Round } from "../../domain/entities/round";

export const GAME_REALTIME_PUBLISHER = Symbol("GAME_REALTIME_PUBLISHER");

export type RoundRealtimePayload = {
  roundId: string;
  status: string;
  crashPoint: number;
  currentMultiplier: number;
};

export type BetRealtimePayload = {
  roundId: string;
  betId: string;
  playerId: string;
  amountCents: string;
  status: string;
  cashoutMultiplier?: number;
  payoutCents?: string;
};

export interface GameRealtimePublisher {
  publishRoundStarted(round: Round, currentMultiplier: number): void;
  publishRoundMultiplier(round: Round, currentMultiplier: number): void;
  publishRoundCrashed(round: Round, currentMultiplier: number, lostBets: readonly Bet[]): void;
  publishRoundSettled(round: Round, currentMultiplier: number): void;
  publishBetPlaced(bet: Bet): void;
  publishBetCashedOut(bet: Bet): void;
  publishBetRejected(bet: Bet): void;
}
