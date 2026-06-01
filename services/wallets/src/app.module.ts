import { Module } from "@nestjs/common";
import { WALLET_REPOSITORY } from "./application/ports/wallet-repository";
import { CreateWalletUseCase } from "./application/use-cases/create-wallet.use-case";
import { GetWalletUseCase } from "./application/use-cases/get-wallet.use-case";
import { ReserveWalletBalanceUseCase } from "./application/use-cases/reserve-wallet-balance.use-case";
import { PrismaService } from "./infrastructure/prisma.service";
import { PrismaWalletRepository } from "./infrastructure/prisma-wallet.repository";
import { RabbitMqWalletReservationConsumer } from "./infrastructure/rabbitmq-wallet-reservation.consumer";
import { WalletsController } from "./presentation/controllers/wallets.controller";

@Module({
  controllers: [WalletsController],
  providers: [
    PrismaService,
    CreateWalletUseCase,
    GetWalletUseCase,
    ReserveWalletBalanceUseCase,
    RabbitMqWalletReservationConsumer,
    {
      provide: WALLET_REPOSITORY,
      useClass: PrismaWalletRepository,
    },
  ],
})
export class AppModule {}
