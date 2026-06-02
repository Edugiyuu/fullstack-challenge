import { describe, expect, it } from "bun:test";

const API_BASE_URL = process.env.E2E_API_BASE_URL ?? "http://localhost:8000";
const TOKEN_URL =
  process.env.E2E_KEYCLOAK_TOKEN_URL ?? "http://localhost:8080/realms/crash-game/protocol/openid-connect/token";
const CLIENT_ID = process.env.E2E_KEYCLOAK_CLIENT_ID ?? "crash-game-client";
const USERNAME = process.env.E2E_USERNAME ?? "player";
const PASSWORD = process.env.E2E_PASSWORD ?? "player123";

type WalletResponse = {
  id: string;
  playerId: string;
  balanceCents: string;
  reservedCents: string;
};

describe("Wallet e2e", () => {
  it("requires auth and returns the authenticated player's wallet", async () => {
    await waitForGateway();

    const unauthorizedWallet = await fetch(`${API_BASE_URL}/wallets/me`);
    expect(unauthorizedWallet.status).toBe(401);

    const token = await getAccessToken();
    const authHeaders = { Authorization: `Bearer ${token}` };

    const createdWalletResponse = await fetch(`${API_BASE_URL}/wallets`, {
      method: "POST",
      headers: authHeaders,
    });
    expect(createdWalletResponse.ok).toBe(true);

    const createdWallet = (await createdWalletResponse.json()) as WalletResponse;
    expect(createdWallet.playerId).toBe(USERNAME);
    expect(BigInt(createdWallet.balanceCents)).toBeGreaterThanOrEqual(0n);
    expect(BigInt(createdWallet.reservedCents)).toBeGreaterThanOrEqual(0n);

    const currentWalletResponse = await fetch(`${API_BASE_URL}/wallets/me`, {
      headers: authHeaders,
    });
    expect(currentWalletResponse.ok).toBe(true);

    const currentWallet = (await currentWalletResponse.json()) as WalletResponse;
    expect(currentWallet.id).toBe(createdWallet.id);
    expect(currentWallet.playerId).toBe(USERNAME);
  }, 30_000);
});

async function getAccessToken(): Promise<string> {
  return poll(async () => {
    try {
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
      const payload = (await response.json().catch(() => null)) as { access_token?: string } | null;
      return response.ok && payload?.access_token ? payload.access_token : null;
    } catch {
      return null;
    }
  }, 30_000);
}

async function waitForGateway(): Promise<true> {
  return poll(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/wallets/health`);
      return response.ok ? true : null;
    } catch {
      return null;
    }
  }, 30_000);
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
