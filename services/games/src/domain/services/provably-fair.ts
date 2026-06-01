import { createHash, createHmac } from "node:crypto";

const HMAC_BITS = 52;
const HMAC_HEX_CHARS = HMAC_BITS / 4;
const HOUSE_EDGE = 0.01;
const MIN_CRASH_POINT = 100;

type CrashPointParams = {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
};

type VerifyParams = CrashPointParams & {
  serverSeedHash: string;
  crashPoint: number;
};

export class ProvablyFair {
  static hashServerSeed(serverSeed: string): string {
    return createHash("sha256").update(serverSeed).digest("hex");
  }

  static calculateCrashPoint(params: CrashPointParams): number {
    const hmac = createHmac("sha256", params.serverSeed)
      .update(`${params.clientSeed}:${params.nonce}`)
      .digest("hex");
    const sample = Number.parseInt(hmac.slice(0, HMAC_HEX_CHARS), 16);
    const maxSample = 2 ** HMAC_BITS;
    const randomRatio = sample / maxSample;

    if (randomRatio === 1) {
      return MIN_CRASH_POINT;
    }

    const crashPoint = Math.floor(((1 - HOUSE_EDGE) / (1 - randomRatio)) * 100);
    return Math.max(MIN_CRASH_POINT, crashPoint);
  }

  static verify(params: VerifyParams): boolean {
    const serverSeedHash = ProvablyFair.hashServerSeed(params.serverSeed);

    if (serverSeedHash !== params.serverSeedHash) {
      return false;
    }

    return ProvablyFair.calculateCrashPoint(params) === params.crashPoint;
  }
}
