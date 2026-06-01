import { WalletReserveRequestedMessage } from "./messages";

export const WALLET_RESERVATION_PUBLISHER = Symbol("WALLET_RESERVATION_PUBLISHER");

export interface WalletReservationPublisher {
  publish(message: WalletReserveRequestedMessage): Promise<void>;
}
