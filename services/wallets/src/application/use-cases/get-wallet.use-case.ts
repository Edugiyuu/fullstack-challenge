import { Inject, Injectable } from "@nestjs/common";
import { Wallet } from "../../domain/entities/wallet";
import { WALLET_REPOSITORY } from "../ports/wallet-repository";
import type { WalletRepository } from "../ports/wallet-repository";

@Injectable()
export class GetWalletUseCase {
  constructor(@Inject(WALLET_REPOSITORY) private readonly wallets: WalletRepository) {}

  async execute(playerId: string): Promise<Wallet | null> {
    return this.wallets.findByPlayerId(playerId);
  }
}
