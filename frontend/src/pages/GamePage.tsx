import { useCallback, useEffect, useMemo, useState } from "react";
import { BetControls } from "../components/BetControls";
import { BetResultOverlay, type BetResultOverlayState } from "../components/BetResultOverlay";
import { FlightPanel } from "../components/FlightPanel";
import { HistoryPanel } from "../components/HistoryPanel";
import { LiveBetsPanel } from "../components/LiveBetsPanel";
import { TopBar } from "../components/TopBar";
import { useGameSocket } from "../hooks/useGameSocket";
import { useAuth } from "../hooks/useAuth";
import { useWallet } from "../hooks/useWallet";
import { cashoutBet, getCurrentRound, isUnauthorizedApiError, placeBet } from "../lib/api";
import type { BetResult, LiveBet, Round } from "../types/game";
import { formatCurrency, toErrorMessage } from "../utils/format";
import { calculatePayoutCents, toCentsString } from "../utils/money";

type GamePageProps = {
  onLogout: () => void;
};

export function GamePage({ onLogout }: GamePageProps) {
  const { invalidateSession, logout, playerId } = useAuth();
  const { ensureWallet, error: walletError, isLoading: isWalletLoading, refreshWallet, wallet } = useWallet();
  const [round, setRound] = useState<Round | null>(null);
  const [betAmount, setBetAmount] = useState("100");
  const [autoCashout, setAutoCashout] = useState("2.00x");
  const [activeBet, setActiveBet] = useState<BetResult | null>(null);
  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);
  const [history, setHistory] = useState<number[]>([]);
  const [notice, setNotice] = useState("Voce pode apostar durante a fase de apostas. Cash out antes do crash!");
  const [isBetting, setIsBetting] = useState(false);
  const [isCashingOut, setIsCashingOut] = useState(false);
  const [betResult, setBetResult] = useState<BetResultOverlayState | null>(null);

  const refreshRound = useCallback(async () => {
    const currentRound = await getCurrentRound();
    setRound(currentRound);
  }, []);

  const handleApiError = useCallback(
    async (error: unknown) => {
      if (isUnauthorizedApiError(error)) {
        await invalidateSession();
        setNotice("Sessao expirada. Faca login novamente.");
        onLogout();
        return;
      }

      setNotice(toErrorMessage(error));
    },
    [invalidateSession, onLogout],
  );

  const delayedWalletRefresh = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 900));
    try {
      await refreshWallet();
    } catch (error) {
      await handleApiError(error);
    }
  }, [handleApiError, refreshWallet]);

  const showBetResult = useCallback((result: Omit<BetResultOverlayState, "id">) => {
    setBetResult((current) => ({
      ...result,
      id: (current?.id ?? 0) + 1,
    }));
  }, []);

  const handlePlayerLost = useCallback(
    ({ crashMultiplier }: { crashMultiplier: number }) => {
      showBetResult({
        type: "LOSE",
        multiplier: crashMultiplier,
      });
    },
    [showBetResult],
  );
  const clearBetResult = useCallback(() => {
    setBetResult(null);
  }, []);

  useEffect(() => {
    void ensureWallet().catch((error: unknown) => {
      void handleApiError(error);
    });
    void refreshRound();
  }, [ensureWallet, handleApiError, refreshRound]);

  useGameSocket({
    activeBet,
    delayedWalletRefresh,
    onPlayerLost: handlePlayerLost,
    setActiveBet,
    setHistory,
    setLiveBets,
    setNotice,
    setRound,
  });

  async function handleBet() {
    const amountCents = toCentsString(betAmount);

    if (BigInt(amountCents) <= 0n) {
      setNotice("Informe um valor de aposta valido.");
      return;
    }

    if (BigInt(amountCents) > BigInt(availableBalanceCents)) {
      setNotice("Saldo insuficiente para essa aposta.");
      return;
    }

    setIsBetting(true);
    try {
      const bet = await placeBet(amountCents);
      setActiveBet(bet);
      setNotice("Aposta aceita. Aguardando reserva da carteira.");
      await delayedWalletRefresh();
    } catch (error) {
      await handleApiError(error);
    } finally {
      setIsBetting(false);
    }
  }

  async function handleCashout() {
    setIsCashingOut(true);
    try {
      const cashout = await cashoutBet();
      showBetResult({
        type: "WIN",
        multiplier: cashout.cashoutMultiplier,
        payoutCents: cashout.payoutCents,
      });
      setActiveBet(null);
      setNotice(`Cashout confirmado: ${formatCurrency(cashout.payoutCents)}.`);
      await delayedWalletRefresh();
    } catch (error) {
      await handleApiError(error);
    } finally {
      setIsCashingOut(false);
    }
  }

  const multiplier = round?.currentMultiplier ?? 100;
  const possiblePayout = useMemo(() => calculatePayoutCents(betAmount, multiplier), [betAmount, multiplier]);
  const betAmountCents = useMemo(() => BigInt(toCentsString(betAmount)), [betAmount]);
  const availableBalanceCents = useMemo(() => {
    const balanceCents = BigInt(wallet?.balanceCents ?? "0");
    return balanceCents > 0n ? balanceCents.toString() : "0";
  }, [wallet]);
  const hasInsufficientBalance = betAmountCents > 0n && betAmountCents > BigInt(availableBalanceCents);
  const betWarning = hasInsufficientBalance
    ? `Saldo insuficiente. Voce tem ${formatCurrency(availableBalanceCents)} disponivel.`
    : undefined;
  const noticeTone = notice.toLowerCase().includes("saldo insuficiente") ? "error" : "default";
  const canCashout = Boolean(activeBet) && round?.status === "RUNNING";
  const handleLogout = useCallback(async () => {
    await logout();
    onLogout();
  }, [logout, onLogout]);

  return (
    <main className="min-h-screen bg-black text-neutral-100">
      {betResult && <BetResultOverlay result={betResult} onDone={clearBetResult} />}
      <TopBar
        isWalletLoading={isWalletLoading}
        playerId={playerId}
        wallet={wallet}
        walletError={walletError}
        onLogout={handleLogout}
      />
      <section className="grid gap-5 bg-black p-4 md:p-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-5">
          <FlightPanel round={round} />
          <BetControls
            autoCashout={autoCashout}
            betAmount={betAmount}
            betWarning={betWarning}
            canCashout={canCashout}
            isBetting={isBetting}
            isCashingOut={isCashingOut}
            notice={notice}
            noticeTone={noticeTone}
            possiblePayout={possiblePayout}
            roundStatus={round?.status}
            onAutoCashoutChange={setAutoCashout}
            onBet={handleBet}
            onBetAmountChange={setBetAmount}
            onCashout={handleCashout}
          />
        </div>

        <aside className="grid content-start gap-5">
          <LiveBetsPanel liveBets={liveBets} />
          <HistoryPanel history={history} />
        </aside>
      </section>
    </main>
  );
}
