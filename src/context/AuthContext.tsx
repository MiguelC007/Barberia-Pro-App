import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { LoginCredentials, SessionUser } from "../types";
import {
  clearSession,
  createClientSession,
  createGuestSession,
  loadSession,
  loginWithEmail,
  saveSession,
  toAppUser
} from "../services/authService";
import { upsertUser } from "../services/userService";

interface AuthContextValue {
  user: SessionUser | null;
  role: SessionUser["role"];
  isAuthenticated: boolean;
  isReady: boolean;
  login: (credentials: LoginCredentials) => Promise<SessionUser>;
  loginClient: (name: string, phone?: string) => SessionUser;
  continueAsGuest: () => SessionUser;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setUser(loadSession());
    setIsReady(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role || "guest",
      isAuthenticated: Boolean(user),
      isReady,
      async login(credentials) {
        const session = await loginWithEmail(credentials);
        saveSession(session);
        upsertUser(toAppUser(session));
        setUser(session);
        return session;
      },
      loginClient(name, phone) {
        const session = createClientSession(name, phone);
        saveSession(session);
        upsertUser(toAppUser(session));
        setUser(session);
        return session;
      },
      continueAsGuest() {
        const session = createGuestSession();
        saveSession(session);
        setUser(session);
        return session;
      },
      logout() {
        clearSession();
        setUser(null);
      }
    }),
    [isReady, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }
  return context;
}
