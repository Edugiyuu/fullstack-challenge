export const RABBITMQ_EXCHANGE = "crash.events";

export const WALLET_RESERVE_REQUESTED = "wallet.reserve.requested";
export const WALLET_RESERVE_SUCCEEDED = "wallet.reserve.succeeded";
export const WALLET_RESERVE_FAILED = "wallet.reserve.failed";
export const WALLET_BET_LOST_REQUESTED = "wallet.bet.lost.requested";
export const WALLET_CASHOUT_REQUESTED = "wallet.cashout.requested";
export const WALLET_CASHOUT_SUCCEEDED = "wallet.cashout.succeeded";
export const WALLET_CASHOUT_FAILED = "wallet.cashout.failed";

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

export type WalletBetLostRequestedMessage = {
  messageId: string;
  idempotencyKey: string;
  playerId: string;
  roundId: string;
  betId: string;
  amountCents: string;
  occurredAt: string;
};

export type WalletCashoutRequestedMessage = {
  messageId: string;
  idempotencyKey: string;
  playerId: string;
  roundId: string;
  betId: string;
  reservedAmountCents: string;
  payoutCents: string;
  occurredAt: string;
};

export type WalletCashoutSucceededMessage = WalletCashoutRequestedMessage & {
  walletTransactionId: string;
};

export type WalletCashoutFailedMessage = WalletCashoutRequestedMessage & {
  reason: WalletReserveFailedReason;
};
