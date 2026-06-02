import { API_BASE_URL, PLAYER_ID } from "./config";
import { getAuthSession } from "./auth";
import type { BetResult, CashoutResult, Round } from "../types/game";
import type { Wallet } from "../types/wallet";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isUnauthorizedApiError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 401;
}

export async function createWallet(): Promise<Wallet> {
  const response = await fetch(`${API_BASE_URL}/wallets`, {
    method: "POST",
    headers: await authHeaders(),
  });
  return parseJsonResponse<Wallet>(response);
}

export async function getWallet(): Promise<Wallet> {
  const response = await fetch(`${API_BASE_URL}/wallets/me`, {
    headers: await authHeaders(),
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
    headers: await authHeaders({ "content-type": "application/json" }),
    body: JSON.stringify({ amountCents }),
  });
  return parseJsonResponse<BetResult>(response);
}

export async function cashoutBet(): Promise<CashoutResult> {
  const response = await fetch(`${API_BASE_URL}/games/bet/cashout`, {
    method: "POST",
    headers: await authHeaders(),
  });
  return parseJsonResponse<CashoutResult>(response);
}

async function authHeaders(extraHeaders: HeadersInit = {}): Promise<HeadersInit> {
  const session = await getAuthSession();
  const headers: Record<string, string> = {
    "x-player-id": session.playerId ?? PLAYER_ID,
    ...Object.fromEntries(new Headers(extraHeaders)),
  };

  if (session.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  }

  return headers;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(toResponseMessage(payload), response.status);
  }

  return payload as T;
}

function toResponseMessage(payload: unknown): string {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;

    if (typeof message === "string") {
      return message;
    }

    if (Array.isArray(message)) {
      return message.join(", ");
    }
  }

  return "Erro de rede";
}
