import { describe, expect, it } from "bun:test";

const API_BASE_URL = process.env.E2E_API_BASE_URL ?? "http://localhost:8000";
const TOKEN_URL =
  process.env.E2E_KEYCLOAK_TOKEN_URL ?? "http://localhost:8080/realms/crash-game/protocol/openid-connect/token";
const CLIENT_ID = process.env.E2E_KEYCLOAK_CLIENT_ID ?? "crash-game-client";
const USERNAME = process.env.E2E_USERNAME ?? "player";
const PASSWORD = process.env.E2E_PASSWORD ?? "player123";

type RoundResponse = {
  id: string;
  status: string;
  currentMultiplier: number;
};

type WalletResponse = {
  balanceCents: string;
  reservedCents: string;
};

describe("Crash gameplay e2e", () => {
  it("requires auth for protected endpoints and completes bet reservation flow", async () => {
    await waitForGateway();

    const unauthorizedBet = await fetch(`${API_BASE_URL}/games/bet`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amountCents: "100" }),
    });
    expect(unauthorizedBet.status).toBe(401);

    const token = await getAccessToken();
    const authHeaders = { Authorization: `Bearer ${token}` };

    const createWallet = await fetch(`${API_BASE_URL}/wallets`, {
      method: "POST",
      headers: authHeaders,
    });
    expect(createWallet.ok).toBe(true);

    await waitForBettingRound();

    const walletBefore = await getWallet(authHeaders);
    const bet = await fetch(`${API_BASE_URL}/games/bet`, {
      method: "POST",
      headers: { ...authHeaders, "content-type": "application/json" },
      body: JSON.stringify({ amountCents: "100" }),
    });
    expect(bet.ok).toBe(true);

    const walletAfterReservation = await waitForWalletReservation(authHeaders);
    expect(BigInt(walletAfterReservation.balanceCents)).toBe(BigInt(walletBefore.balanceCents) - 100n);
    expect(BigInt(walletAfterReservation.reservedCents)).toBeGreaterThanOrEqual(100n);
  }, 90_000);
});

async function getAccessToken(): Promise<string> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "password",
      password: PASSWORD,
      username: USERNAME,
    }),
  });
  const payload = (await response.json()) as { access_token?: string };

  if (!response.ok || !payload.access_token) {
    throw new Error(`Unable to get Keycloak token: ${response.status}`);
  }

  return payload.access_token;
}

async function getWallet(headers: HeadersInit): Promise<WalletResponse> {
  const response = await fetch(`${API_BASE_URL}/wallets/me`, { headers });
  expect(response.ok).toBe(true);
  return (await response.json()) as WalletResponse;
}

async function getCurrentRound(): Promise<RoundResponse> {
  const response = await fetch(`${API_BASE_URL}/games/rounds/current`);
  expect(response.ok).toBe(true);
  return (await response.json()) as RoundResponse;
}

async function waitForBettingRound(): Promise<RoundResponse> {
  return poll(async () => {
    const round = await getCurrentRound();
    return round.status === "BETTING" ? round : null;
  }, 70_000);
}

async function waitForGateway(): Promise<true> {
  return poll(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/games/health`);
      return response.ok ? true : null;
    } catch {
      return null;
    }
  }, 30_000);
}

async function waitForWalletReservation(headers: HeadersInit): Promise<WalletResponse> {
  return poll(async () => {
    const wallet = await getWallet(headers);
    return BigInt(wallet.reservedCents) > 0n ? wallet : null;
  }, 10_000);
}

async function poll<T>(fn: () => Promise<T | null>, timeoutMs: number): Promise<T> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const result = await fn();

    if (result) {
      return result;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error("Timed out waiting for e2e condition");
}
