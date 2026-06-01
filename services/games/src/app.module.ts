import { Module } from "@nestjs/common";
import { RequestWalletReservationUseCase } from "./application/request-wallet-reservation.use-case";
import { WALLET_RESERVATION_PUBLISHER } from "./application/wallet-reservation-publisher";
import { RabbitMqWalletReservationPublisher } from "./infrastructure/rabbitmq-wallet-reservation.publisher";
import { RabbitMqWalletReservationResultsConsumer } from "./infrastructure/rabbitmq-wallet-reservation-results.consumer";
import { GamesController } from "./presentation/controllers/games.controller";

@Module({
  controllers: [GamesController],
  providers: [
    RequestWalletReservationUseCase,
    RabbitMqWalletReservationResultsConsumer,
    {
      provide: WALLET_RESERVATION_PUBLISHER,
      useClass: RabbitMqWalletReservationPublisher,
    },
  ],
})
export class AppModule {}
