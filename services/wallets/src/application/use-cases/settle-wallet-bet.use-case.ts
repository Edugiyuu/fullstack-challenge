import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Wallet } from "../../domain/entities/wallet";
import { InsufficientFundsError } from "../../domain/errors";
import { Money } from "../../domain/value-objects/money";
import { WALLET_REPOSITORY } from "../ports/wallet-repository";
import type { WalletRepository } from "../ports/wallet-repository";

export type SettleLostBetCommand = {
  playerId: string;
  roundId: string;
  betId: string;
  amountCents: string;
};

export type SettleCashoutCommand = {
  playerId: string;
  roundId: string;
  betId: string;
  reservedAmountCents: string;
  payoutCents: string;
};

export type WalletSettlementResult =
  | {
      status: "succeeded";
      playerId: string;
      roundId: string;
      betId: string;
      walletTransactionId: string;
    }
  | {
      status: "failed";
      playerId: string;
      roundId: string;
      betId: string;
      reason: "INSUFFICIENT_FUNDS" | "WALLET_NOT_FOUND" | "UNKNOWN";
    };

@Injectable()
export class SettleWalletBetUseCase {
  constructor(@Inject(WALLET_REPOSITORY) private readonly wallets: WalletRepository) {}

  async lost(command: SettleLostBetCommand): Promise<WalletSettlementResult> {
    return this.settle(command, (wallet) => {
      wallet.settleLostBet(Money.fromCents(BigInt(command.amountCents)));
    });
  }

  async cashout(command: SettleCashoutCommand): Promise<WalletSettlementResult> {
    return this.settle(command, (wallet) => {
      wallet.settleCashout(
        Money.fromCents(BigInt(command.reservedAmountCents)),
        Money.fromCents(BigInt(command.payoutCents)),
      );
    });
  }

  private async settle(
    command: { playerId: string; roundId: string; betId: string },
    applySettlement: (wallet: Wallet) => void,
  ): Promise<WalletSettlementResult> {
    const wallet = await this.wallets.findByPlayerId(command.playerId);

    if (!wallet) {
      return this.failed(command, "WALLET_NOT_FOUND");
    }

    try {
      applySettlement(wallet);
      await this.wallets.save(wallet);

      return {
        status: "succeeded",
        playerId: command.playerId,
        roundId: command.roundId,
        betId: command.betId,
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
    command: { playerId: string; roundId: string; betId: string },
    reason: "INSUFFICIENT_FUNDS" | "WALLET_NOT_FOUND" | "UNKNOWN",
  ): WalletSettlementResult {
    return {
      status: "failed",
      playerId: command.playerId,
      roundId: command.roundId,
      betId: command.betId,
      reason,
    };
  }
}
