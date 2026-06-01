import { Module } from "@nestjs/common";
import { WALLET_RESERVATION_PUBLISHER } from "./application/ports/wallet-reservation-publisher";
import { CurrentRoundService } from "./application/services/current-round.service";
import { PlaceBetUseCase } from "./application/use-cases/place-bet.use-case";
import { RequestWalletReservationUseCase } from "./application/use-cases/request-wallet-reservation.use-case";
import { RabbitMqWalletReservationPublisher } from "./infrastructure/rabbitmq-wallet-reservation.publisher";
import { RabbitMqWalletReservationResultsConsumer } from "./infrastructure/rabbitmq-wallet-reservation-results.consumer";
import { GamesController } from "./presentation/controllers/games.controller";

@Module({
  controllers: [GamesController],
  providers: [
    CurrentRoundService,
    PlaceBetUseCase,
    RequestWalletReservationUseCase,
    RabbitMqWalletReservationResultsConsumer,
    {
      provide: WALLET_RESERVATION_PUBLISHER,
      useClass: RabbitMqWalletReservationPublisher,
    },
  ],
})
export class AppModule {}
