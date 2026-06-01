import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { io } from "socket.io-client";
import { WS_URL } from "../lib/config";
import type { LiveBet, Round } from "../types/game";
import { formatMultiplier } from "../utils/format";

type UseGameSocketParams = {
  delayedWalletRefresh: () => Promise<void>;
  setActiveBet: (bet: null) => void;
  setHistory: Dispatch<SetStateAction<number[]>>;
  setLiveBets: Dispatch<SetStateAction<LiveBet[]>>;
  setNotice: Dispatch<SetStateAction<string>>;
  setRound: Dispatch<SetStateAction<Round | null>>;
};

export function useGameSocket({
  delayedWalletRefresh,
  setActiveBet,
  setHistory,
  setLiveBets,
  setNotice,
  setRound,
}: UseGameSocketParams) {
  useEffect(() => {
    const socket = io(WS_URL, {
      transports: ["websocket"],
    });

    socket.on("connect", () => setNotice("Tempo real conectado."));
    socket.on("round:started", (payload: { currentMultiplier: number; status: string }) => {
      setRound((current) => (current ? { ...current, status: payload.status, currentMultiplier: payload.currentMultiplier } : current));
      setNotice("Rodada em andamento.");
    });
    socket.on("round:multiplier", (payload: { currentMultiplier: number; status: string }) => {
      setRound((current) => (current ? { ...current, status: payload.status, currentMultiplier: payload.currentMultiplier } : current));
    });
    socket.on("round:crashed", (payload: { currentMultiplier: number; status: string }) => {
      setRound((current) => (current ? { ...current, status: payload.status, currentMultiplier: payload.currentMultiplier } : current));
      setHistory((current) => [payload.currentMultiplier, ...current].slice(0, 18));
      setNotice(`Crash em ${formatMultiplier(payload.currentMultiplier)}.`);
      setActiveBet(null);
      void delayedWalletRefresh();
    });
    socket.on("round:settled", (payload: { currentMultiplier: number; status: string }) => {
      setRound((current) => (current ? { ...current, status: payload.status, currentMultiplier: payload.currentMultiplier } : current));
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

    return () => {
      socket.disconnect();
    };
  }, [delayedWalletRefresh, setActiveBet, setHistory, setLiveBets, setNotice, setRound]);
}
