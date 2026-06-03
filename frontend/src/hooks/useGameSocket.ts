import { useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { io } from "socket.io-client";
import { WS_URL } from "../lib/config";
import type { BetResult, LiveBet, Round } from "../types/game";
import { formatMultiplier } from "../utils/format";

type UseGameSocketParams = {
  activeBet: BetResult | null;
  delayedWalletRefresh: () => Promise<void>;
  onPlayerLost: (payload: { crashMultiplier: number }) => void;
  setActiveBet: (bet: null) => void;
  setHistory: Dispatch<SetStateAction<number[]>>;
  setLiveBets: Dispatch<SetStateAction<LiveBet[]>>;
  setNotice: Dispatch<SetStateAction<string>>;
  setRound: Dispatch<SetStateAction<Round | null>>;
};

type RoundRealtimePayload = {
  roundId: string;
  status: string;
  crashPoint: number;
  currentMultiplier: number;
  bettingEndsAt?: string;
};

export function useGameSocket({
  activeBet,
  delayedWalletRefresh,
  onPlayerLost,
  setActiveBet,
  setHistory,
  setLiveBets,
  setNotice,
  setRound,
}: UseGameSocketParams) {
  const activeBetRef = useRef<BetResult | null>(activeBet);

  useEffect(() => {
    activeBetRef.current = activeBet;
  }, [activeBet]);

  useEffect(() => {
    const socket = io(WS_URL, {
      transports: ["websocket"],
    });

    socket.on("connect", () => setNotice("Tempo real conectado."));
    socket.on("round:betting", (payload: RoundRealtimePayload) => {
      setRound((current) => mergeRoundPayload(current, payload));
      setLiveBets([]);
      setNotice("Nova rodada aberta.");
    });
    socket.on("round:started", (payload: RoundRealtimePayload) => {
      setRound((current) => mergeRoundPayload(current, payload));
      setNotice("Rodada em andamento.");
    });
    socket.on("round:multiplier", (payload: RoundRealtimePayload) => {
      setRound((current) => mergeRoundPayload(current, payload));
    });
    socket.on("round:crashed", (payload: RoundRealtimePayload & { lostBets?: LiveBet[] }) => {
      setRound((current) => mergeRoundPayload(current, payload));
      setLiveBets((current) =>
        current.map((bet) => {
          const lostBet = payload.lostBets?.find((currentLostBet) => currentLostBet.betId === bet.betId || currentLostBet.betId === bet.id);
          return lostBet ? { ...bet, ...lostBet } : bet;
        }),
      );
      setHistory((current) => [payload.currentMultiplier, ...current].slice(0, 18));
      setNotice(`Crash em ${formatMultiplier(payload.currentMultiplier)}.`);
      const playerActiveBet = activeBetRef.current;
      const activeBetWasLost =
        Boolean(playerActiveBet) &&
        playerActiveBet?.roundId === payload.roundId &&
        (!payload.lostBets?.length ||
          payload.lostBets.some((lostBet) => lostBet.betId === playerActiveBet.betId || lostBet.id === playerActiveBet.betId));

      if (activeBetWasLost) {
        onPlayerLost({ crashMultiplier: payload.currentMultiplier });
      }

      setActiveBet(null);
      void delayedWalletRefresh();
    });
    socket.on("round:settled", (payload: RoundRealtimePayload) => {
      setRound((current) => mergeRoundPayload(current, payload));
    });
    socket.on("bet:placed", (payload: LiveBet) => {
      setLiveBets((current) => [payload, ...current].slice(0, 8));
    });
    socket.on("bet:cashedout", (payload: LiveBet) => {
      setLiveBets((current) =>
        current.map((bet) => (bet.betId === payload.betId || bet.id === payload.betId ? { ...bet, ...payload } : bet)),
      );
      setNotice(`Cashout em ${formatMultiplier(payload.cashoutMultiplier ?? 100)}.`);
      void delayedWalletRefresh();
    });
    socket.on("bet:rejected", (payload: LiveBet) => {
      setLiveBets((current) =>
        current.map((bet) => (bet.betId === payload.betId || bet.id === payload.betId ? { ...bet, ...payload } : bet)),
      );
      setActiveBet(null);
      setNotice("Saldo insuficiente. A aposta foi recusada pela carteira.");
      void delayedWalletRefresh();
    });

    return () => {
      socket.disconnect();
    };
  }, [delayedWalletRefresh, onPlayerLost, setActiveBet, setHistory, setLiveBets, setNotice, setRound]);
}

function mergeRoundPayload(current: Round | null, payload: RoundRealtimePayload): Round {
  return {
    id: payload.roundId,
    status: payload.status,
    crashPoint: payload.crashPoint,
    currentMultiplier: payload.currentMultiplier,
    bettingEndsAt: payload.bettingEndsAt ?? (current?.id === payload.roundId ? current.bettingEndsAt : undefined),
    bets: current?.id === payload.roundId ? current.bets : [],
  };
}
