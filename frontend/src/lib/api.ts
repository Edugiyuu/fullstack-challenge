import { API_BASE_URL, PLAYER_ID } from "./config";
import type { BetResult, CashoutResult, Round } from "../types/game";
import type { Wallet } from "../types/wallet";

export async function createWallet(): Promise<Wallet> {
  const response = await fetch(`${API_BASE_URL}/wallets`, {
    method: "POST",
    headers: { "x-player-id": PLAYER_ID },
  });
  return parseJsonResponse<Wallet>(response);
}

export async function getWallet(): Promise<Wallet> {
  const response = await fetch(`${API_BASE_URL}/wallets/me`, {
    headers: { "x-player-id": PLAYER_ID },
  });
  return parseJsonResponse<Wallet>(response);
}

export async function getCurrentRound(): Promise<Round> {
  const response = await fetch(`${API_BASE_URL}/games/rounds/current`);
  return parseJsonResponse<Round>(response);
}

export async function placeBet(amountCents: string): Promise<BetResult> {
  const response = await fetch(`${API_BASE_URL}/games/bet`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-player-id": PLAYER_ID,
    },
    body: JSON.stringify({ amountCents }),
  });
  return parseJsonResponse<BetResult>(response);
}

export async function cashoutBet(): Promise<CashoutResult> {
  const response = await fetch(`${API_BASE_URL}/games/bet/cashout`, {
    method: "POST",
    headers: { "x-player-id": PLAYER_ID },
  });
  return parseJsonResponse<CashoutResult>(response);
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message ?? "Erro de rede");
  }

  return payload as T;
}
