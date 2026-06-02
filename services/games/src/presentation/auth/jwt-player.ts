import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createPublicKey, createVerify } from "node:crypto";

type Jwk = {
  kid?: string;
  [key: string]: unknown;
};

type Jwks = {
  keys: Jwk[];
};

type JwtHeader = {
  alg?: string;
  kid?: string;
};

type JwtPayload = {
  aud?: string | string[];
  azp?: string;
  email?: string;
  exp?: number;
  iss?: string;
  preferred_username?: string;
  sub?: string;
};

@Injectable()
export class JwtPlayerVerifier {
  private jwks?: Jwks;

  async resolvePlayerId(authorizationHeader: string | undefined): Promise<string> {
    const token = this.extractBearerToken(authorizationHeader);
    const payload = await this.verify(token);
    const playerId = payload.preferred_username ?? payload.email ?? payload.sub;

    if (!playerId) {
      throw new UnauthorizedException("Token does not identify a player");
    }

    return playerId;
  }

  private extractBearerToken(authorizationHeader: string | undefined): string {
    const [scheme, token] = authorizationHeader?.split(" ") ?? [];

    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    return token;
  }

  private async verify(token: string): Promise<JwtPayload> {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");

    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      throw new UnauthorizedException("Invalid token");
    }

    const header = this.decode<JwtHeader>(encodedHeader);
    const payload = this.decode<JwtPayload>(encodedPayload);

    if (header.alg !== "RS256" || !header.kid) {
      throw new UnauthorizedException("Unsupported token algorithm");
    }

    this.validateClaims(payload);

    const jwks = await this.getJwks();
    const jwk = jwks.keys.find((key) => key.kid === header.kid);

    if (!jwk) {
      throw new UnauthorizedException("Token signing key not found");
    }

    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${encodedHeader}.${encodedPayload}`);
    verifier.end();

    const isValid = verifier.verify(
      createPublicKey({ key: jwk, format: "jwk" } as Parameters<typeof createPublicKey>[0]),
      Buffer.from(encodedSignature, "base64url"),
    );

    if (!isValid) {
      throw new UnauthorizedException("Invalid token signature");
    }

    return payload;
  }

  private decode<T>(value: string): T {
    try {
      return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
    } catch {
      throw new UnauthorizedException("Invalid token payload");
    }
  }

  private validateClaims(payload: JwtPayload): void {
    const expectedIssuer = process.env.KEYCLOAK_ISSUER ?? "http://localhost:8080/realms/crash-game";
    const expectedClientId = process.env.KEYCLOAK_CLIENT_ID ?? "crash-game-client";
    const audience = Array.isArray(payload.aud) ? payload.aud : payload.aud ? [payload.aud] : [];

    if (payload.iss !== expectedIssuer) {
      throw new UnauthorizedException("Invalid token issuer");
    }

    if (!payload.exp || payload.exp * 1000 <= Date.now()) {
      throw new UnauthorizedException("Expired token");
    }

    if (payload.azp !== expectedClientId && !audience.includes(expectedClientId)) {
      throw new UnauthorizedException("Invalid token audience");
    }
  }

  private async getJwks(): Promise<Jwks> {
    if (this.jwks) {
      return this.jwks;
    }

    const jwksUrl =
      process.env.KEYCLOAK_JWKS_URL ?? "http://localhost:8080/realms/crash-game/protocol/openid-connect/certs";
    const response = await fetch(jwksUrl);

    if (!response.ok) {
      throw new UnauthorizedException("Unable to load token signing keys");
    }

    this.jwks = (await response.json()) as Jwks;
    return this.jwks;
  }
}
