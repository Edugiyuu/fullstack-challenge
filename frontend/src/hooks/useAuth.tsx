import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "oidc-client-ts";
import { authManager, toAuthSession } from "../lib/auth";

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  playerId: string;
  user: User | null;
  completeLogin: () => Promise<void>;
  invalidateSession: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    authManager
      .getUser()
      .then((storedUser) => {
        if (isMounted) {
          setUser(storedUser && !storedUser.expired ? storedUser : null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    const handleUserLoaded = (loadedUser: User) => setUser(loadedUser);
    const handleUserUnloaded = () => setUser(null);

    authManager.events.addUserLoaded(handleUserLoaded);
    authManager.events.addUserUnloaded(handleUserUnloaded);

    return () => {
      isMounted = false;
      authManager.events.removeUserLoaded(handleUserLoaded);
      authManager.events.removeUserUnloaded(handleUserUnloaded);
    };
  }, []);

  const login = useCallback(async () => {
    await authManager.signinRedirect();
  }, []);

  const completeLogin = useCallback(async () => {
    const loggedUser = await authManager.signinRedirectCallback();
    setUser(loggedUser);
  }, []);

  const invalidateSession = useCallback(async () => {
    await authManager.removeUser();
    setUser(null);
  }, []);

  const logout = useCallback(async () => {
    const currentUser = await authManager.getUser();

    if (!currentUser) {
      setUser(null);
      return;
    }

    await authManager.signoutRedirect();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const session = toAuthSession(user);

    return {
      completeLogin,
      invalidateSession,
      isAuthenticated: Boolean(user && !user.expired),
      isLoading,
      login,
      logout,
      playerId: session.playerId,
      user,
    };
  }, [completeLogin, invalidateSession, isLoading, login, logout, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
