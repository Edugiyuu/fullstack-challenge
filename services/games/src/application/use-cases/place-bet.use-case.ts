import { Inject, Injectable, Optional } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { BetStatus } from "../../domain/entities/bet";
import { GAME_REALTIME_PUBLISHER, type GameRealtimePublisher } from "../ports/game-realtime-publisher";
import { CurrentRoundService } from "../services/current-round.service";
import { RequestWalletReservationUseCase } from "./request-wallet-reservation.use-case";

export type PlaceBetCommand = {
  playerId: string;
  amountCents: bigint;
};

export type PlaceBetResult = {
  roundId: string;
  betId: string;
  playerId: string;
  amountCents: string;
  status: BetStatus;
};

@Injectable()
export class PlaceBetUseCase {
  constructor(
    private readonly currentRound: CurrentRoundService,
    private readonly requestWalletReservation: RequestWalletReservationUseCase,
    @Optional()
    @Inject(GAME_REALTIME_PUBLISHER)
    private readonly gameRealtime?: GameRealtimePublisher,
  ) {}

  async execute(command: PlaceBetCommand): Promise<PlaceBetResult> {
    const round = this.currentRound.getCurrentRound();
    const bet = round.placeBet({
      id: randomUUID(),
      playerId: command.playerId,
      amountCents: command.amountCents,
    });

    await this.requestWalletReservation.execute({
      playerId: bet.playerId,
      roundId: bet.roundId,
      betId: bet.id,
      amountCents: bet.amountCents,
    });
    this.gameRealtime?.publishBetPlaced(bet);
    this.currentRound.startCurrentRound();

    return {
      roundId: bet.roundId,
      betId: bet.id,
      playerId: bet.playerId,
      amountCents: bet.amountCents.toString(),
      status: bet.status,
    };
  }
}
