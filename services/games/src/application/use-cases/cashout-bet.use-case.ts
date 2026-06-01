import { Injectable } from "@nestjs/common";
import { CurrentRoundService } from "../services/current-round.service";
import { RequestWalletCashoutUseCase } from "./request-wallet-cashout.use-case";

export type CashoutBetCommand = {
  playerId: string;
};

export type CashoutBetResult = {
  roundId: string;
  betId: string;
  playerId: string;
  amountCents: string;
  cashoutMultiplier: number;
  payoutCents: string;
  status: string;
};

@Injectable()
export class CashoutBetUseCase {
  constructor(
    private readonly currentRound: CurrentRoundService,
    private readonly requestWalletCashout: RequestWalletCashoutUseCase,
  ) {}

  async execute(command: CashoutBetCommand): Promise<CashoutBetResult> {
    const roundState = this.currentRound.getCurrentRoundState();
    const bet = roundState.round.cashout(command.playerId, roundState.currentMultiplier);

    await this.requestWalletCashout.execute({
      playerId: bet.playerId,
      roundId: bet.roundId,
      betId: bet.id,
      reservedAmountCents: bet.amountCents,
      payoutCents: bet.payoutCents ?? 0n,
    });

    return {
      roundId: bet.roundId,
      betId: bet.id,
      playerId: bet.playerId,
      amountCents: bet.amountCents.toString(),
      cashoutMultiplier: bet.cashoutMultiplier ?? roundState.currentMultiplier,
      payoutCents: (bet.payoutCents ?? 0n).toString(),
      status: bet.status,
    };
  }
}
