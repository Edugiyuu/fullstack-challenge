import { Module } from "@nestjs/common";
import { ReserveWalletBalanceUseCase } from "./application/reserve-wallet-balance.use-case";
import { WALLET_REPOSITORY } from "./application/wallet-repository";
import { InMemoryWalletRepository } from "./infrastructure/in-memory-wallet.repository";
import { RabbitMqWalletReservationConsumer } from "./infrastructure/rabbitmq-wallet-reservation.consumer";
import { WalletsController } from "./presentation/controllers/wallets.controller";

@Module({
  controllers: [WalletsController],
  providers: [
    ReserveWalletBalanceUseCase,
    RabbitMqWalletReservationConsumer,
    {
      provide: WALLET_REPOSITORY,
      useClass: InMemoryWalletRepository,
    },
  ],
})
export class AppModule {}
