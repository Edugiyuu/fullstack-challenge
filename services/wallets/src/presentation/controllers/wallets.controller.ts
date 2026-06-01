import { Body, Controller, Get, Headers, Post } from "@nestjs/common";
import { CreateWalletUseCase } from "../../application/create-wallet.use-case";
import { GetWalletUseCase } from "../../application/get-wallet.use-case";
import { Wallet } from "../../domain/wallet";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";

@Controller()
export class WalletsController {
  constructor(
    private readonly createWallet: CreateWalletUseCase,
    private readonly getWallet: GetWalletUseCase,
  ) {}

  @Get("health")
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "wallets" };
  }

  @Post()
  async create(@Headers("x-player-id") playerIdHeader?: string, @Body("playerId") playerIdBody?: string): Promise<WalletResponseDto> {
    const wallet = await this.createWallet.execute(resolvePlayerId(playerIdHeader, playerIdBody));
    return toWalletResponse(wallet);
  }

  @Get("me")
  async me(@Headers("x-player-id") playerIdHeader?: string, @Body("playerId") playerIdBody?: string): Promise<WalletResponseDto | null> {
    const wallet = await this.getWallet.execute(resolvePlayerId(playerIdHeader, playerIdBody));
    return wallet ? toWalletResponse(wallet) : null;
  }
}

type WalletResponseDto = {
  id: string;
  playerId: string;
  balanceCents: string;
  reservedCents: string;
};

function resolvePlayerId(playerIdHeader?: string, playerIdBody?: string): string {
  return playerIdHeader?.trim() || playerIdBody?.trim() || "player";
}

function toWalletResponse(wallet: Wallet): WalletResponseDto {
  return {
    id: wallet.id,
    playerId: wallet.playerId,
    balanceCents: wallet.balanceCents.toString(),
    reservedCents: wallet.reservedCents.toString(),
  };
}
