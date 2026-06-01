import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { InsufficientFundsError } from "../domain/errors";
import { Money } from "../domain/money";
import { WALLET_REPOSITORY, type WalletRepository } from "./wallet-repository";

export type ReserveWalletBalanceCommand = {
  idempotencyKey: string;
  playerId: string;
  roundId: string;
  betId: string;
  amountCents: string;
};

export type ReserveWalletBalanceResult =
  | {
      status: "succeeded";
      idempotencyKey: string;
      playerId: string;
      roundId: string;
      betId: string;
      amountCents: string;
      walletTransactionId: string;
    }
  | {
      status: "failed";
      idempotencyKey: string;
      playerId: string;
      roundId: string;
      betId: string;
      amountCents: string;
      reason: "INSUFFICIENT_FUNDS" | "WALLET_NOT_FOUND" | "UNKNOWN";
    };

@Injectable()
export class ReserveWalletBalanceUseCase {
  constructor(@Inject(WALLET_REPOSITORY) private readonly wallets: WalletRepository) {}

  async execute(command: ReserveWalletBalanceCommand): Promise<ReserveWalletBalanceResult> {
    const wallet = await this.wallets.findByPlayerId(command.playerId);

    if (!wallet) {
      return this.failed(command, "WALLET_NOT_FOUND");
    }

    try {
      wallet.reserve(Money.fromCents(BigInt(command.amountCents)));
      await this.wallets.save(wallet);

      return {
        status: "succeeded",
        idempotencyKey: command.idempotencyKey,
        playerId: command.playerId,
        roundId: command.roundId,
        betId: command.betId,
        amountCents: command.amountCents,
        walletTransactionId: randomUUID(),
      };
    } catch (error) {
      if (error instanceof InsufficientFundsError) {
        return this.failed(command, "INSUFFICIENT_FUNDS");
      }

      return this.failed(command, "UNKNOWN");
    }
  }

  private failed(
    command: ReserveWalletBalanceCommand,
    reason: "INSUFFICIENT_FUNDS" | "WALLET_NOT_FOUND" | "UNKNOWN",
  ): ReserveWalletBalanceResult {
    return {
      status: "failed",
      idempotencyKey: command.idempotencyKey,
      playerId: command.playerId,
      roundId: command.roundId,
      betId: command.betId,
      amountCents: command.amountCents,
      reason,
    };
  }
}
