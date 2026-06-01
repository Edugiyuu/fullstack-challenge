import { Wallet } from "../../domain/entities/wallet";

export const WALLET_REPOSITORY = Symbol("WALLET_REPOSITORY");

export interface WalletRepository {
  findByPlayerId(playerId: string): Promise<Wallet | null>;
  save(wallet: Wallet): Promise<void>;
}
