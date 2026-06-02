import { Module } from "@nestjs/common";
import { WALLET_REPOSITORY } from "./application/ports/wallet-repository";
import { CreateWalletUseCase } from "./application/use-cases/create-wallet.use-case";
import { GetWalletUseCase } from "./application/use-cases/get-wallet.use-case";
import { ReserveWalletBalanceUseCase } from "./application/use-cases/reserve-wallet-balance.use-case";
import { SettleWalletBetUseCase } from "./application/use-cases/settle-wallet-bet.use-case";
import { RabbitMqWalletReservationConsumer } from "./infrastructure/messaging/rabbitmq-wallet-reservation.consumer";
import { PrismaService } from "./infrastructure/persistence/prisma.service";
import { PrismaWalletRepository } from "./infrastructure/persistence/prisma-wallet.repository";
import { JwtPlayerVerifier } from "./presentation/auth/jwt-player";
import { WalletsController } from "./presentation/controllers/wallets.controller";

@Module({
  controllers: [WalletsController],
  providers: [
    PrismaService,
    CreateWalletUseCase,
    GetWalletUseCase,
    JwtPlayerVerifier,
    ReserveWalletBalanceUseCase,
    SettleWalletBetUseCase,
    RabbitMqWalletReservationConsumer,
    {
      provide: WALLET_REPOSITORY,
      useClass: PrismaWalletRepository,
    },
  ],
})
export class AppModule {}
