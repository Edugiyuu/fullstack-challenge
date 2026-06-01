import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { WalletReserveRequestedMessage } from "./messages";
import { WALLET_RESERVATION_PUBLISHER, type WalletReservationPublisher } from "./wallet-reservation-publisher";

export type RequestWalletReservationCommand = {
  playerId: string;
  roundId: string;
  betId: string;
  amountCents: bigint;
};

@Injectable()
export class RequestWalletReservationUseCase {
  constructor(
    @Inject(WALLET_RESERVATION_PUBLISHER)
    private readonly walletReservations: WalletReservationPublisher,
  ) {}

  async execute(command: RequestWalletReservationCommand): Promise<WalletReserveRequestedMessage> {
    const message: WalletReserveRequestedMessage = {
      messageId: randomUUID(),
      idempotencyKey: `${command.roundId}:${command.betId}:reserve`,
      playerId: command.playerId,
      roundId: command.roundId,
      betId: command.betId,
      amountCents: command.amountCents.toString(),
      occurredAt: new Date().toISOString(),
    };

    await this.walletReservations.publish(message);
    return message;
  }
}
