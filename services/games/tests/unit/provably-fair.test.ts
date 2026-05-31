import { describe, expect, it } from "bun:test";
import { ProvablyFair } from "../../src/domain/provably-fair";

const serverSeed = "round-server-seed";
const clientSeed = "player-visible-client-seed";

describe("ProvablyFair", () => {
  it("generates the same server seed hash for the same server seed", () => {
    const firstHash = ProvablyFair.hashServerSeed(serverSeed);
    const secondHash = ProvablyFair.hashServerSeed(serverSeed);

    expect(firstHash).toBe(secondHash);
    expect(firstHash).toHaveLength(64);
  });

  it("calculates the same crash point for the same seeds and nonce", () => {
    const firstCrashPoint = ProvablyFair.calculateCrashPoint({
      serverSeed,
      clientSeed,
      nonce: 1,
    });
    const secondCrashPoint = ProvablyFair.calculateCrashPoint({
      serverSeed,
      clientSeed,
      nonce: 1,
    });

    expect(firstCrashPoint).toBe(secondCrashPoint);
  });

  it("changes the crash point when the nonce changes", () => {
    const firstCrashPoint = ProvablyFair.calculateCrashPoint({
      serverSeed,
      clientSeed,
      nonce: 1,
    });
    const secondCrashPoint = ProvablyFair.calculateCrashPoint({
      serverSeed,
      clientSeed,
      nonce: 2,
    });

    expect(firstCrashPoint).not.toBe(secondCrashPoint);
  });

  it("verifies matching round data", () => {
    const crashPoint = ProvablyFair.calculateCrashPoint({
      serverSeed,
      clientSeed,
      nonce: 1,
    });

    const verified = ProvablyFair.verify({
      serverSeed,
      serverSeedHash: ProvablyFair.hashServerSeed(serverSeed),
      clientSeed,
      nonce: 1,
      crashPoint,
    });

    expect(verified).toBe(true);
  });

  it("rejects verification when the server seed hash does not match", () => {
    const crashPoint = ProvablyFair.calculateCrashPoint({
      serverSeed,
      clientSeed,
      nonce: 1,
    });

    const verified = ProvablyFair.verify({
      serverSeed,
      serverSeedHash: ProvablyFair.hashServerSeed("another-server-seed"),
      clientSeed,
      nonce: 1,
      crashPoint,
    });

    expect(verified).toBe(false);
  });

  it("rejects verification when the crash point does not match", () => {
    const verified = ProvablyFair.verify({
      serverSeed,
      serverSeedHash: ProvablyFair.hashServerSeed(serverSeed),
      clientSeed,
      nonce: 1,
      crashPoint: 999,
    });

    expect(verified).toBe(false);
  });

  it("never returns a crash point below 1.00x", () => {
    for (let nonce = 1; nonce <= 50; nonce += 1) {
      const crashPoint = ProvablyFair.calculateCrashPoint({
        serverSeed,
        clientSeed,
        nonce,
      });

      expect(crashPoint).toBeGreaterThanOrEqual(100);
    }
  });
});
