import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { WalletCashoutRequestedMessage } from "../messages/wallet-reservation.messages";
import { WALLET_SETTLEMENT_PUBLISHER, type WalletSettlementPublisher } from "../ports/wallet-settlement-publisher";

export type RequestWalletCashoutCommand = {
  playerId: string;
  roundId: string;
  betId: string;
  reservedAmountCents: bigint;
  payoutCents: bigint;
};

@Injectable()
export class RequestWalletCashoutUseCase {
  constructor(
    @Inject(WALLET_SETTLEMENT_PUBLISHER)
    private readonly walletSettlements: WalletSettlementPublisher,
  ) {}

  async execute(command: RequestWalletCashoutCommand): Promise<WalletCashoutRequestedMessage> {
    const message: WalletCashoutRequestedMessage = {
      messageId: randomUUID(),
      idempotencyKey: `${command.roundId}:${command.betId}:cashout`,
      playerId: command.playerId,
      roundId: command.roundId,
      betId: command.betId,
      reservedAmountCents: command.reservedAmountCents.toString(),
      payoutCents: command.payoutCents.toString(),
      occurredAt: new Date().toISOString(),
    };

    await this.walletSettlements.publishCashout(message);
    return message;
  }
}
