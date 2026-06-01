import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { connect, type Channel, type ChannelModel, type ConsumeMessage } from "amqplib";
import {
  RABBITMQ_EXCHANGE,
  WALLET_RESERVE_FAILED,
  WALLET_RESERVE_SUCCEEDED,
  WalletReserveFailedMessage,
  WalletReserveSucceededMessage,
} from "../application/messages";

const RESULTS_QUEUE = "games.wallet.reserve.results";

@Injectable()
export class RabbitMqWalletReservationResultsConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqWalletReservationResultsConsumer.name);
  private connection?: ChannelModel;
  private channel?: Channel;

  async onModuleInit(): Promise<void> {
    try {
      await this.connectWithRetry();
      this.logger.log("RabbitMQ wallet reservation results consumer connected");
    } catch (error) {
      this.logger.error("Failed to connect RabbitMQ wallet reservation results consumer", error);
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
    await this.channel.assertQueue(RESULTS_QUEUE, { durable: true });
    await this.channel.bindQueue(RESULTS_QUEUE, RABBITMQ_EXCHANGE, WALLET_RESERVE_SUCCEEDED);
    await this.channel.bindQueue(RESULTS_QUEUE, RABBITMQ_EXCHANGE, WALLET_RESERVE_FAILED);
    await this.channel.consume(RESULTS_QUEUE, (message) => this.handleMessage(message));
  }

  private handleMessage(message: ConsumeMessage | null): void {
    if (!message || !this.channel) {
      return;
    }

    try {
      const payload = JSON.parse(message.content.toString()) as
        | WalletReserveSucceededMessage
        | WalletReserveFailedMessage;
      this.logger.log(`Wallet reservation result received: ${JSON.stringify(payload)}`);
      this.channel.ack(message);
    } catch (error) {
      this.logger.error("Failed to process wallet reservation result", error);
      this.channel.nack(message, false, false);
    }
  }
}
