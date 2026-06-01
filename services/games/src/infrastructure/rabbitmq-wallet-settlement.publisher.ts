import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { connect, type Channel, type ChannelModel } from "amqplib";
import {
  RABBITMQ_EXCHANGE,
  WALLET_BET_LOST_REQUESTED,
  WALLET_CASHOUT_REQUESTED,
  WalletBetLostRequestedMessage,
  WalletCashoutRequestedMessage,
} from "../application/messages/wallet-reservation.messages";
import { type WalletSettlementPublisher } from "../application/ports/wallet-settlement-publisher";

@Injectable()
export class RabbitMqWalletSettlementPublisher implements WalletSettlementPublisher, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqWalletSettlementPublisher.name);
  private connection?: ChannelModel;
  private channel?: Channel;

  async onModuleInit(): Promise<void> {
    try {
      await this.connectWithRetry();
      this.logger.log("RabbitMQ wallet settlement publisher connected");
    } catch (error) {
      this.logger.error("Failed to connect RabbitMQ wallet settlement publisher", error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  async publishBetLost(message: WalletBetLostRequestedMessage): Promise<void> {
    await this.publish(WALLET_BET_LOST_REQUESTED, message);
  }

  async publishCashout(message: WalletCashoutRequestedMessage): Promise<void> {
    await this.publish(WALLET_CASHOUT_REQUESTED, message);
  }

  private async publish(routingKey: string, message: WalletBetLostRequestedMessage | WalletCashoutRequestedMessage): Promise<void> {
    await this.ensureConnected();
    this.channel?.publish(RABBITMQ_EXCHANGE, routingKey, Buffer.from(JSON.stringify(message)), {
      contentType: "application/json",
      persistent: true,
    });
  }

  private async ensureConnected(): Promise<void> {
    if (!this.channel) {
      await this.connectWithRetry();
    }
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
  }
}
