import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import LoginModal from "./LoginModal";
import { apiRequest } from "../config/api";

const AuthContext = createContext(null);

const STORAGE_TOKEN_KEY = "cv_auth_token";
const STORAGE_USER_KEY = "cv_auth_user";

const postJson = (path, body, fallbackError) => apiRequest(path, { method: "POST", body, fallbackError });

function readStoredSession() {
  try {
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem(STORAGE_USER_KEY) || "null");
    return token && user ? { token, user } : null;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [modalView, setModalView] = useState(null);
  const pendingActionRef = useRef(null);

  const persistSession = useCallback((nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    try {
      localStorage.setItem(STORAGE_TOKEN_KEY, nextToken);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(nextUser));
    } catch {
    }
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
    } catch {
    }
  }, []);

  useEffect(() => {
    const stored = readStoredSession();
    if (!stored) {
      setIsReady(true);
      return;
    }
    setToken(stored.token);
    setUser(stored.user);

    let cancelled = false;
    apiRequest("/auth/me", { token: stored.token })
      .then((data) => {
        if (!cancelled && data.user) persistSession(stored.token, data.user);
      })
      .catch((err) => {
        if (!cancelled && err.status === 401) clearSession();
      })
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [clearSession, persistSession]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_TOKEN_KEY && e.key !== STORAGE_USER_KEY) return;
      const stored = readStoredSession();
      setToken(stored ? stored.token : null);
      setUser(stored ? stored.user : null);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const completeAuth = useCallback(
    (data) => {
      persistSession(data.token, data.user);
      setModalView(null);
      if (pendingActionRef.current) {
        const action = pendingActionRef.current;
        pendingActionRef.current = null;
        action();
      }
      return data.user;
    },
    [persistSession]
  );

  const signup = useCallback(
    async (name, email, password) =>
      completeAuth(await postJson("/auth/signup", { name, email, password }, "Couldn't create your account. Try again.")),
    [completeAuth]
  );

  const login = useCallback(
    async (email, password) =>
      completeAuth(await postJson("/auth/login", { email, password }, "Couldn't log you in. Try again.")),
    [completeAuth]
  );

  const requestPasswordReset = useCallback(async (email) => {
    await postJson("/auth/forgot-password", { email }, "Couldn't send the reset code. Try again.");
  }, []);

  const resetPassword = useCallback(
    async (email, otp, password) =>
      completeAuth(
        await postJson("/auth/reset-password", { email, otp, password }, "Couldn't reset your password. Try again.")
      ),
    [completeAuth]
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const authRequest = useCallback(
    async (path, options = {}) => {
      try {
        return await apiRequest(path, { ...options, token });
      } catch (err) {
        if (err.status === 401) clearSession();
        throw err;
      }
    },
    [token, clearSession]
  );

  const openLogin = useCallback(() => {
    pendingActionRef.current = null;
    setModalView("login");
  }, []);

  const openSignup = useCallback(() => {
    pendingActionRef.current = null;
    setModalView("signup");
  }, []);

  const closeLogin = useCallback(() => {
    pendingActionRef.current = null;
    setModalView(null);
  }, []);

  const requireAuth = useCallback(
    (action) => {
      if (user) {
        action();
        return;
      }
      pendingActionRef.current = action;
      setModalView("login");
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      isReady,
      signup,
      login,
      requestPasswordReset,
      resetPassword,
      logout,
      authRequest,
      openLogin,
      openSignup,
      closeLogin,
      requireAuth,
    }),
    [user, token, isReady, signup, login, requestPasswordReset, resetPassword, logout, authRequest, openLogin, openSignup, closeLogin, requireAuth]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginModal isOpen={modalView !== null} initialView={modalView || "login"} onClose={closeLogin} />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an <AuthProvider>");
  return ctx;
};
