import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { connect, type Channel, type ChannelModel, type ConsumeMessage } from "amqplib";
import {
  RABBITMQ_EXCHANGE,
  WALLET_BET_LOST_REQUESTED,
  WALLET_CASHOUT_FAILED,
  WALLET_CASHOUT_REQUESTED,
  WALLET_CASHOUT_SUCCEEDED,
  WALLET_RESERVE_FAILED,
  WALLET_RESERVE_REQUESTED,
  WALLET_RESERVE_SUCCEEDED,
  WalletBetLostRequestedMessage,
  WalletCashoutFailedMessage,
  WalletCashoutRequestedMessage,
  WalletCashoutSucceededMessage,
  WalletReserveFailedMessage,
  WalletReserveRequestedMessage,
  WalletReserveSucceededMessage,
} from "../application/messages/wallet-reservation.messages";
import { ReserveWalletBalanceUseCase } from "../application/use-cases/reserve-wallet-balance.use-case";
import { SettleWalletBetUseCase } from "../application/use-cases/settle-wallet-bet.use-case";

const REQUESTS_QUEUE = "wallets.reserve.requests";

@Injectable()
export class RabbitMqWalletReservationConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqWalletReservationConsumer.name);
  private connection?: ChannelModel;
  private channel?: Channel;

  constructor(
    private readonly reserveWalletBalance: ReserveWalletBalanceUseCase,
    private readonly settleWalletBet: SettleWalletBetUseCase,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.connectWithRetry();
      this.logger.log("RabbitMQ wallet reservation consumer connected");
    } catch (error) {
      this.logger.error("Failed to connect RabbitMQ wallet reservation consumer", error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  private async connectWithRetry(attempts = 10): Promise<void> {
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        await this.connect();
        return;
      } catch (error) {
        if (attempt === attempts) {
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, 2_000));
      }
    }
  }

  private async connect(): Promise<void> {
    const rabbitUrl = process.env.RABBITMQ_URL ?? "amqp://admin:admin@localhost:5672";
    this.connection = await connect(rabbitUrl);
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(RABBITMQ_EXCHANGE, "topic", { durable: true });
    await this.channel.assertQueue(REQUESTS_QUEUE, { durable: true });
    await this.channel.bindQueue(REQUESTS_QUEUE, RABBITMQ_EXCHANGE, WALLET_RESERVE_REQUESTED);
    await this.channel.bindQueue(REQUESTS_QUEUE, RABBITMQ_EXCHANGE, WALLET_BET_LOST_REQUESTED);
    await this.channel.bindQueue(REQUESTS_QUEUE, RABBITMQ_EXCHANGE, WALLET_CASHOUT_REQUESTED);
    await this.channel.prefetch(10);
    await this.channel.consume(REQUESTS_QUEUE, (message) => void this.handleMessage(message));
  }

  private async handleMessage(message: ConsumeMessage | null): Promise<void> {
    if (!message || !this.channel) {
      return;
    }

    try {
      await this.routeMessage(message.fields.routingKey, JSON.parse(message.content.toString()));

      this.channel.ack(message);
    } catch (error) {
      this.logger.error("Failed to process wallet reservation request", error);
      this.channel.nack(message, false, false);
    }
  }

  private async routeMessage(routingKey: string, payload: unknown): Promise<void> {
    if (routingKey === WALLET_RESERVE_REQUESTED) {
      await this.handleReserveRequested(payload as WalletReserveRequestedMessage);
      return;
    }

    if (routingKey === WALLET_BET_LOST_REQUESTED) {
      await this.handleBetLostRequested(payload as WalletBetLostRequestedMessage);
      return;
    }

    if (routingKey === WALLET_CASHOUT_REQUESTED) {
      await this.handleCashoutRequested(payload as WalletCashoutRequestedMessage);
    }
  }

  private async handleReserveRequested(payload: WalletReserveRequestedMessage): Promise<void> {
    const result = await this.reserveWalletBalance.execute(payload);
    const occurredAt = new Date().toISOString();

    if (result.status === "succeeded") {
      const response: WalletReserveSucceededMessage = {
        messageId: randomUUID(),
        idempotencyKey: result.idempotencyKey,
        playerId: result.playerId,
        roundId: result.roundId,
        betId: result.betId,
        amountCents: result.amountCents,
        walletTransactionId: result.walletTransactionId,
        occurredAt,
      };
      this.publish(WALLET_RESERVE_SUCCEEDED, response);
    } else {
      const response: WalletReserveFailedMessage = {
        messageId: randomUUID(),
        idempotencyKey: result.idempotencyKey,
        playerId: result.playerId,
        roundId: result.roundId,
        betId: result.betId,
        amountCents: result.amountCents,
        reason: result.reason,
        occurredAt,
      };
      this.publish(WALLET_RESERVE_FAILED, response);
    }
  }

  private async handleBetLostRequested(payload: WalletBetLostRequestedMessage): Promise<void> {
    await this.settleWalletBet.lost(payload);
  }

  private async handleCashoutRequested(payload: WalletCashoutRequestedMessage): Promise<void> {
    const result = await this.settleWalletBet.cashout(payload);
    const occurredAt = new Date().toISOString();

    if (result.status === "succeeded") {
      const response: WalletCashoutSucceededMessage = {
        ...payload,
        messageId: randomUUID(),
        walletTransactionId: result.walletTransactionId,
        occurredAt,
      };
      this.publish(WALLET_CASHOUT_SUCCEEDED, response);
    } else {
      const response: WalletCashoutFailedMessage = {
        ...payload,
        messageId: randomUUID(),
        reason: result.reason,
        occurredAt,
      };
      this.publish(WALLET_CASHOUT_FAILED, response);
    }
  }

  private publish(
    routingKey: string,
    payload:
      | WalletReserveSucceededMessage
      | WalletReserveFailedMessage
      | WalletCashoutSucceededMessage
      | WalletCashoutFailedMessage,
  ): void {
    this.channel?.publish(RABBITMQ_EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), {
      contentType: "application/json",
      persistent: true,
    });
  }
}
