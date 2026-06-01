import { useCallback, useEffect, useMemo, useState } from "react";
import { BetControls } from "../components/BetControls";
import { FlightPanel } from "../components/FlightPanel";
import { HistoryPanel } from "../components/HistoryPanel";
import { LiveBetsPanel } from "../components/LiveBetsPanel";
import { TopBar } from "../components/TopBar";
import { initialHistory, initialLiveBets } from "../data/mock-game";
import { useGameSocket } from "../hooks/useGameSocket";
import { useWallet } from "../hooks/useWallet";
import { cashoutBet, getCurrentRound, placeBet } from "../lib/api";
import type { BetResult, LiveBet, Round } from "../types/game";
import { formatCurrency, toErrorMessage } from "../utils/format";
import { calculatePayoutCents, toCentsString } from "../utils/money";

type GamePageProps = {
  onLogout: () => void;
};

export function GamePage({ onLogout }: GamePageProps) {
  const { ensureWallet, refreshWallet, wallet } = useWallet();
  const [round, setRound] = useState<Round | null>(null);
  const [betAmount, setBetAmount] = useState("100");
  const [autoCashout, setAutoCashout] = useState("2.00x");
  const [activeBet, setActiveBet] = useState<BetResult | null>(null);
  const [liveBets, setLiveBets] = useState<LiveBet[]>(initialLiveBets);
  const [history, setHistory] = useState<number[]>(initialHistory);
  const [notice, setNotice] = useState("Voce pode apostar durante a fase de apostas. Cash out antes do crash!");
  const [isBetting, setIsBetting] = useState(false);
  const [isCashingOut, setIsCashingOut] = useState(false);

  const refreshRound = useCallback(async () => {
    const currentRound = await getCurrentRound();
    setRound(currentRound);
  }, []);

  const delayedWalletRefresh = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 900));
    await refreshWallet();
  }, [refreshWallet]);

  useEffect(() => {
    void ensureWallet();
    void refreshRound();
  }, [ensureWallet, refreshRound]);

  useGameSocket({
    delayedWalletRefresh,
    setActiveBet,
    setHistory,
    setLiveBets,
    setNotice,
    setRound,
  });

  async function handleBet() {
    setIsBetting(true);
    try {
      const bet = await placeBet(toCentsString(betAmount));
      setActiveBet(bet);
      setNotice("Aposta aceita. Aguardando reserva da carteira.");
      await delayedWalletRefresh();
    } catch (error) {
      setNotice(toErrorMessage(error));
    } finally {
      setIsBetting(false);
    }
  }

  async function handleCashout() {
    setIsCashingOut(true);
    try {
      const cashout = await cashoutBet();
      setActiveBet(null);
      setNotice(`Cashout confirmado: ${formatCurrency(cashout.payoutCents)}.`);
      await delayedWalletRefresh();
    } catch (error) {
      setNotice(toErrorMessage(error));
    } finally {
      setIsCashingOut(false);
    }
  }

  const multiplier = round?.currentMultiplier ?? 100;
  const possiblePayout = useMemo(() => calculatePayoutCents(betAmount, multiplier), [betAmount, multiplier]);
  const canCashout = Boolean(activeBet) && round?.status === "RUNNING";

  return (
    <main className="min-h-screen bg-black text-neutral-100">
      <TopBar wallet={wallet} onLogout={onLogout} />
      <section className="grid gap-5 bg-black p-4 md:p-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-5">
          <FlightPanel round={round} />
          <BetControls
            autoCashout={autoCashout}
            betAmount={betAmount}
            canCashout={canCashout}
            isBetting={isBetting}
            isCashingOut={isCashingOut}
            notice={notice}
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
