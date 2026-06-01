import { Inject, Injectable } from "@nestjs/common";
import { WALLET_REPOSITORY } from "./wallet-repository";
import type { WalletRepository } from "./wallet-repository";
import { Wallet } from "../domain/wallet";

@Injectable()
export class GetWalletUseCase {
  constructor(@Inject(WALLET_REPOSITORY) private readonly wallets: WalletRepository) {}

  async execute(playerId: string): Promise<Wallet | null> {
    return this.wallets.findByPlayerId(playerId);
  }
}
