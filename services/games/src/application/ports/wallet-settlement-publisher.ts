import { WalletBetLostRequestedMessage, WalletCashoutRequestedMessage } from "../messages/wallet-reservation.messages";

export const WALLET_SETTLEMENT_PUBLISHER = Symbol("WALLET_SETTLEMENT_PUBLISHER");

export interface WalletSettlementPublisher {
  publishBetLost(message: WalletBetLostRequestedMessage): Promise<void>;
  publishCashout(message: WalletCashoutRequestedMessage): Promise<void>;
}
