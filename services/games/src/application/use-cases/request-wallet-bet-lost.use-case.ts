import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { WalletBetLostRequestedMessage } from "../messages/wallet-reservation.messages";
import { WALLET_SETTLEMENT_PUBLISHER, type WalletSettlementPublisher } from "../ports/wallet-settlement-publisher";

export type RequestWalletBetLostCommand = {
  playerId: string;
  roundId: string;
  betId: string;
  amountCents: bigint;
};

@Injectable()
export class RequestWalletBetLostUseCase {
  constructor(
    @Inject(WALLET_SETTLEMENT_PUBLISHER)
    private readonly walletSettlements: WalletSettlementPublisher,
  ) {}

  async execute(command: RequestWalletBetLostCommand): Promise<WalletBetLostRequestedMessage> {
    const message: WalletBetLostRequestedMessage = {
      messageId: randomUUID(),
      idempotencyKey: `${command.roundId}:${command.betId}:lost`,
      playerId: command.playerId,
      roundId: command.roundId,
      betId: command.betId,
      amountCents: command.amountCents.toString(),
      occurredAt: new Date().toISOString(),
    };

    await this.walletSettlements.publishBetLost(message);
    return message;
  }
}
