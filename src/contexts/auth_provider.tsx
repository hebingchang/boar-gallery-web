import { PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext, AuthorSession } from "./auth.ts";
import { LoginResponse } from "../models/gallery.ts";

const STORAGE_KEY = "boar-gallery.author-session";

interface TokenClaims {
  author_id: number;
  name: string;
  exp: number;
}

function decodeTokenClaims(token: string): TokenClaims | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), "=");
    const bytes = Uint8Array.from(window.atob(padded), (character) => character.charCodeAt(0));
    const claims: unknown = JSON.parse(new TextDecoder().decode(bytes));

    if (
      typeof claims !== "object" ||
      claims === null ||
      typeof (claims as Partial<TokenClaims>).author_id !== "number" ||
      typeof (claims as Partial<TokenClaims>).name !== "string" ||
      typeof (claims as Partial<TokenClaims>).exp !== "number"
    ) {
      return null;
    }

    return claims as TokenClaims;
  } catch {
    return null;
  }
}

function createSession(response: LoginResponse): AuthorSession | null {
  const claims = decodeTokenClaims(response.token);
  const responseExpiresAt = Date.parse(response.expires_at);
  if (!claims || !Number.isFinite(responseExpiresAt)) return null;

  const expiresAt = Math.min(responseExpiresAt, claims.exp * 1000);
  if (expiresAt <= Date.now()) return null;

  return {
    token: response.token,
    tokenType: response.token_type,
    expiresAt: new Date(expiresAt).toISOString(),
    author: {
      id: claims.author_id,
      name: claims.name,
    },
  };
}

function parseStoredSession(value: string | null): AuthorSession | null {
  if (!value) return null;

  try {
    const stored: unknown = JSON.parse(value);
    if (typeof stored !== "object" || stored === null) return null;

    const candidate = stored as Partial<AuthorSession>;
    if (
      typeof candidate.token !== "string" ||
      typeof candidate.tokenType !== "string" ||
      typeof candidate.expiresAt !== "string"
    ) {
      return null;
    }

    return createSession({
      token: candidate.token,
      token_type: candidate.tokenType,
      expires_at: candidate.expiresAt,
    });
  } catch {
    return null;
  }
}

function getInitialSession() {
  if (typeof window === "undefined") return null;

  try {
    return parseStoredSession(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthorSession | null>(getInitialSession);

  const login = useCallback((response: LoginResponse) => {
    const nextSession = createSession(response);
    if (!nextSession) throw new Error("Invalid login response");

    setSession(nextSession);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    } catch {
      // Keep the in-memory session when persistent storage is unavailable.
    }
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // The in-memory session has already been cleared.
    }
  }, []);

  useEffect(() => {
    if (!session) return;

    const remainingLifetime = Date.parse(session.expiresAt) - Date.now();
    if (remainingLifetime <= 0) {
      logout();
      return;
    }

    const timeout = window.setTimeout(logout, remainingLifetime);
    return () => window.clearTimeout(timeout);
  }, [logout, session]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setSession(parseStoredSession(event.newValue));
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const value = useMemo(
    () => ({ session, isAuthenticated: session !== null, login, logout }),
    [login, logout, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
