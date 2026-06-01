import { Injectable } from "@nestjs/common";
import { type WalletRepository } from "../application/ports/wallet-repository";
import { Wallet } from "../domain/entities/wallet";
import { PrismaService } from "./prisma.service";

@Injectable()
export class PrismaWalletRepository implements WalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByPlayerId(playerId: string): Promise<Wallet | null> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { playerId },
    });

    if (!wallet) {
      return null;
    }

    return Wallet.rehydrate({
      id: wallet.id,
      playerId: wallet.playerId,
      balanceCents: wallet.balanceCents,
      reservedCents: wallet.reservedCents,
    });
  }

  async save(wallet: Wallet): Promise<void> {
    await this.prisma.wallet.upsert({
      where: { playerId: wallet.playerId },
      create: {
        id: wallet.id,
        playerId: wallet.playerId,
        balanceCents: wallet.balanceCents,
        reservedCents: wallet.reservedCents,
      },
      update: {
        balanceCents: wallet.balanceCents,
        reservedCents: wallet.reservedCents,
      },
    });
  }
}
