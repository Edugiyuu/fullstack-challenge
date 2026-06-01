import { Injectable } from "@nestjs/common";
import { type WalletRepository } from "../application/ports/wallet-repository";
import { Wallet } from "../domain/entities/wallet";

@Injectable()
export class InMemoryWalletRepository implements WalletRepository {
  private readonly walletsByPlayerId = new Map<string, Wallet>();

  async findByPlayerId(playerId: string): Promise<Wallet | null> {
    return this.walletsByPlayerId.get(playerId) ?? null;
  }

  async save(wallet: Wallet): Promise<void> {
    this.walletsByPlayerId.set(wallet.playerId, wallet);
  }
}
