export const RABBITMQ_EXCHANGE = "crash.events";

export const WALLET_RESERVE_REQUESTED = "wallet.reserve.requested";
export const WALLET_RESERVE_SUCCEEDED = "wallet.reserve.succeeded";
export const WALLET_RESERVE_FAILED = "wallet.reserve.failed";

export type WalletReserveRequestedMessage = {
  messageId: string;
  idempotencyKey: string;
  playerId: string;
  roundId: string;
  betId: string;
  amountCents: string;
  occurredAt: string;
};

export type WalletReserveSucceededMessage = {
  messageId: string;
  idempotencyKey: string;
  playerId: string;
  roundId: string;
  betId: string;
  amountCents: string;
  walletTransactionId: string;
  occurredAt: string;
};

export type WalletReserveFailedReason = "INSUFFICIENT_FUNDS" | "WALLET_NOT_FOUND" | "UNKNOWN";

export type WalletReserveFailedMessage = {
  messageId: string;
  idempotencyKey: string;
  playerId: string;
  roundId: string;
  betId: string;
  amountCents: string;
  reason: WalletReserveFailedReason;
  occurredAt: string;
};
