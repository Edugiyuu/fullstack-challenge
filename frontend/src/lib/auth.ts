import { UserManager, WebStorageStateStore, type User } from "oidc-client-ts";
import { KEYCLOAK_AUTHORITY, KEYCLOAK_CLIENT_ID, PLAYER_ID } from "./config";

export const authManager = new UserManager({
  authority: KEYCLOAK_AUTHORITY,
  client_id: KEYCLOAK_CLIENT_ID,
  redirect_uri: `${window.location.origin}/auth/callback`,
  post_logout_redirect_uri: `${window.location.origin}/login`,
  response_type: "code",
  scope: "openid profile email",
  userStore: new WebStorageStateStore({ store: window.localStorage }),
});

export type AuthSession = {
  accessToken?: string;
  playerId: string;
  user?: User | null;
};

export async function getAuthSession(): Promise<AuthSession> {
  const user = await authManager.getUser();
  return toAuthSession(user && !user.expired ? user : null);
}

export function toAuthSession(user: User | null): AuthSession {
  const profilePlayerId = user?.profile.preferred_username ?? user?.profile.email ?? user?.profile.sub;

  return {
    accessToken: user?.access_token,
    playerId: profilePlayerId ?? PLAYER_ID,
    user,
  };
}
