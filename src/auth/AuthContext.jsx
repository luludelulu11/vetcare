import { createContext, useContext, useMemo, useState } from "react";

/**
 * Single source of truth for the session.
 * Replaces the localStorage-reading useEffects scattered across pages.
 *
 * Usage:
 *   const { user, role, token, isAuthenticated, login, logout } = useAuth();
 */
const AuthContext = createContext(null);

function readStoredSession() {
  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");

  if (!token || !userRaw) return { token: null, user: null };

  try {
    return { token, user: JSON.parse(userRaw) };
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession);

  const login = (user, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setSession({ token, user });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setSession({ token: null, user: null });
  };

  const value = useMemo(
    () => ({
      user: session.user,
      token: session.token,
      role: session.user?.role ?? null,
      isAuthenticated: Boolean(session.token && session.user),
      login,
      logout,
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
