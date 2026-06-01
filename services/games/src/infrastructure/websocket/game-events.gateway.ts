import { Logger } from "@nestjs/common";
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Bet } from "../../domain/entities/bet";
import { Round } from "../../domain/entities/round";
import {
  BetRealtimePayload,
  GameRealtimePublisher,
  RoundRealtimePayload,
} from "../../application/ports/game-realtime-publisher";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class GameEventsGateway implements GameRealtimePublisher, OnGatewayConnection {
  private readonly logger = new Logger(GameEventsGateway.name);

  @WebSocketServer()
  private readonly server?: Server;

  handleConnection(client: Socket): void {
    this.logger.log(`WebSocket client connected: ${client.id}`);
  }

  publishRoundStarted(round: Round, currentMultiplier: number): void {
    this.emit("round:started", toRoundPayload(round, currentMultiplier));
  }

  publishRoundMultiplier(round: Round, currentMultiplier: number): void {
    this.emit("round:multiplier", toRoundPayload(round, currentMultiplier));
  }

  publishRoundCrashed(round: Round, currentMultiplier: number, lostBets: readonly Bet[]): void {
    this.emit("round:crashed", {
      ...toRoundPayload(round, currentMultiplier),
      lostBets: lostBets.map(toBetPayload),
    });
  }

  publishRoundSettled(round: Round, currentMultiplier: number): void {
    this.emit("round:settled", toRoundPayload(round, currentMultiplier));
  }

  publishBetPlaced(bet: Bet): void {
    this.emit("bet:placed", toBetPayload(bet));
  }

  publishBetCashedOut(bet: Bet): void {
    this.emit("bet:cashedout", toBetPayload(bet));
  }

  private emit(event: string, payload: unknown): void {
    this.server?.emit(event, payload);
  }
}

function toRoundPayload(round: Round, currentMultiplier: number): RoundRealtimePayload {
  return {
    roundId: round.id,
    status: round.status,
    crashPoint: round.crashPoint,
    currentMultiplier,
  };
}

function toBetPayload(bet: Bet): BetRealtimePayload {
  return {
    roundId: bet.roundId,
    betId: bet.id,
    playerId: bet.playerId,
    amountCents: bet.amountCents.toString(),
    status: bet.status,
    cashoutMultiplier: bet.cashoutMultiplier,
    payoutCents: bet.payoutCents?.toString(),
  };
}
