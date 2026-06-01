import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Wallet } from "../../domain/entities/wallet";
import { WALLET_REPOSITORY } from "../ports/wallet-repository";
import type { WalletRepository } from "../ports/wallet-repository";

export const DEFAULT_INITIAL_BALANCE_CENTS = 100_000n;

@Injectable()
export class CreateWalletUseCase {
  constructor(@Inject(WALLET_REPOSITORY) private readonly wallets: WalletRepository) {}

  async execute(playerId: string): Promise<Wallet> {
    const existingWallet = await this.wallets.findByPlayerId(playerId);

    if (existingWallet) {
      return existingWallet;
    }

    const wallet = Wallet.create({
      id: randomUUID(),
      playerId,
      initialBalanceCents: DEFAULT_INITIAL_BALANCE_CENTS,
    });

    await this.wallets.save(wallet);
    return wallet;
  }
}
