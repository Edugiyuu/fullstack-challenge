import { Module } from "@nestjs/common";
import { GAME_REALTIME_PUBLISHER } from "./application/ports/game-realtime-publisher";
import { WALLET_RESERVATION_PUBLISHER } from "./application/ports/wallet-reservation-publisher";
import { WALLET_SETTLEMENT_PUBLISHER } from "./application/ports/wallet-settlement-publisher";
import { CurrentRoundService } from "./application/services/current-round.service";
import { CashoutBetUseCase } from "./application/use-cases/cashout-bet.use-case";
import { PlaceBetUseCase } from "./application/use-cases/place-bet.use-case";
import { RequestWalletBetLostUseCase } from "./application/use-cases/request-wallet-bet-lost.use-case";
import { RequestWalletCashoutUseCase } from "./application/use-cases/request-wallet-cashout.use-case";
import { RequestWalletReservationUseCase } from "./application/use-cases/request-wallet-reservation.use-case";
import { RabbitMqWalletReservationPublisher } from "./infrastructure/messaging/rabbitmq-wallet-reservation.publisher";
import { RabbitMqWalletReservationResultsConsumer } from "./infrastructure/messaging/rabbitmq-wallet-reservation-results.consumer";
import { RabbitMqWalletSettlementPublisher } from "./infrastructure/messaging/rabbitmq-wallet-settlement.publisher";
import { GameEventsGateway } from "./infrastructure/websocket/game-events.gateway";
import { GamesController } from "./presentation/controllers/games.controller";

@Module({
  controllers: [GamesController],
  providers: [
    CurrentRoundService,
    CashoutBetUseCase,
    PlaceBetUseCase,
    RequestWalletBetLostUseCase,
    RequestWalletCashoutUseCase,
    RequestWalletReservationUseCase,
    GameEventsGateway,
    RabbitMqWalletReservationResultsConsumer,
    {
      provide: GAME_REALTIME_PUBLISHER,
      useExisting: GameEventsGateway,
    },
    {
      provide: WALLET_RESERVATION_PUBLISHER,
      useClass: RabbitMqWalletReservationPublisher,
    },
    {
      provide: WALLET_SETTLEMENT_PUBLISHER,
      useClass: RabbitMqWalletSettlementPublisher,
    },
  ],
})
export class AppModule {}
