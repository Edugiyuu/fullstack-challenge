import { Controller, Get, Headers, Post } from "@nestjs/common";
import { CreateWalletUseCase } from "../../application/use-cases/create-wallet.use-case";
import { GetWalletUseCase } from "../../application/use-cases/get-wallet.use-case";
import { Wallet } from "../../domain/entities/wallet";
import { JwtPlayerVerifier } from "../auth/jwt-player";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";

@Controller()
export class WalletsController {
  constructor(
    private readonly createWallet: CreateWalletUseCase,
    private readonly getWallet: GetWalletUseCase,
    private readonly jwtPlayerVerifier: JwtPlayerVerifier,
  ) {}

  @Get("health")
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "wallets" };
  }

  @Post()
  async create(@Headers("authorization") authorizationHeader?: string): Promise<WalletResponseDto> {
    const playerId = await this.jwtPlayerVerifier.resolvePlayerId(authorizationHeader);
    const wallet = await this.createWallet.execute(playerId);
    return toWalletResponse(wallet);
  }

  @Get("me")
  async me(@Headers("authorization") authorizationHeader?: string): Promise<WalletResponseDto | null> {
    const playerId = await this.jwtPlayerVerifier.resolvePlayerId(authorizationHeader);
    const wallet = await this.getWallet.execute(playerId);
    return wallet ? toWalletResponse(wallet) : null;
  }
}

type WalletResponseDto = {
  id: string;
  playerId: string;
  balanceCents: string;
  reservedCents: string;
};

function toWalletResponse(wallet: Wallet): WalletResponseDto {
  return {
    id: wallet.id,
    playerId: wallet.playerId,
    balanceCents: wallet.balanceCents.toString(),
    reservedCents: wallet.reservedCents.toString(),
  };
}
