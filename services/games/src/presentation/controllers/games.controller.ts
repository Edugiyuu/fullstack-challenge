import { BadRequestException, Body, Controller, Get, Headers, Post } from "@nestjs/common";
import { CurrentRoundService } from "../../application/services/current-round.service";
import { CashoutBetUseCase, type CashoutBetResult } from "../../application/use-cases/cashout-bet.use-case";
import { PlaceBetUseCase, type PlaceBetResult } from "../../application/use-cases/place-bet.use-case";
import { InvalidBetActionError, InvalidBetAmountError } from "../../domain/errors";
import { Round } from "../../domain/entities/round";
import { JwtPlayerVerifier } from "../auth/jwt-player";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";

@Controller()
export class GamesController {
  constructor(
    private readonly currentRound: CurrentRoundService,
    private readonly cashoutBet: CashoutBetUseCase,
    private readonly jwtPlayerVerifier: JwtPlayerVerifier,
    private readonly placeBet: PlaceBetUseCase,
  ) {}

  @Get("health")
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "games" };
  }

  @Get("rounds/current")
  getCurrentRound(): CurrentRoundResponseDto {
    const state = this.currentRound.getCurrentRoundState();
    return toRoundResponse(state.round, state.currentMultiplier);
  }

  @Post("bet")
  async bet(
    @Headers("authorization") authorizationHeader: string | undefined,
    @Body("amountCents") amountCents: string | undefined,
  ): Promise<PlaceBetResult> {
    try {
      return await this.placeBet.execute({
        playerId: await this.jwtPlayerVerifier.resolvePlayerId(authorizationHeader),
        amountCents: parseAmountCents(amountCents),
      });
    } catch (error) {
      if (error instanceof InvalidBetActionError || error instanceof InvalidBetAmountError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @Post("bet/cashout")
  async cashout(@Headers("authorization") authorizationHeader: string | undefined): Promise<CashoutBetResult> {
    try {
      return await this.cashoutBet.execute({
        playerId: await this.jwtPlayerVerifier.resolvePlayerId(authorizationHeader),
      });
    } catch (error) {
      if (error instanceof InvalidBetActionError || error instanceof InvalidBetAmountError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}

type CurrentRoundResponseDto = {
  id: string;
  status: string;
  crashPoint: number;
  currentMultiplier: number;
  serverSeedHash: string;
  clientSeed?: string;
  nonce: number;
  bettingEndsAt: string;
  bets: {
    id: string;
    playerId: string;
    amountCents: string;
    status: string;
  }[];
};

function parseAmountCents(amountCents: string | undefined): bigint {
  if (!amountCents || !/^\d+$/.test(amountCents)) {
    throw new BadRequestException("amountCents must be a string with cents as an integer");
  }

  return BigInt(amountCents);
}

function toRoundResponse(round: Round, currentMultiplier: number): CurrentRoundResponseDto {
  return {
    id: round.id,
    status: round.status,
    crashPoint: round.crashPoint,
    currentMultiplier,
    serverSeedHash: round.serverSeedHash,
    clientSeed: round.clientSeed,
    nonce: round.nonce,
    bettingEndsAt: round.bettingEndsAt.toISOString(),
    bets: round.bets.map((bet) => ({
      id: bet.id,
      playerId: bet.playerId,
      amountCents: bet.amountCents.toString(),
      status: bet.status,
    })),
  };
}
