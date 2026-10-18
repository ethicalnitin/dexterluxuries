import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import LoginModal from "./LoginModal";

/* ============================================================
   AUTH CONTEXT — email + password accounts.

   <AuthProvider> wraps the app once (see App.js) and renders the
   login / sign-up modal itself. Anywhere in the app:

     const { user, isAuthenticated, openLogin, openSignup, logout } = useAuth();

   To gate an action behind login (e.g. a "Buy now" button):

     const { requireAuth } = useAuth();
     requireAuth(() => startCheckout(product)); // runs once signed in

   For an API route protected by requireAuth on the backend, send
   the token:

     const { token } = useAuth();
     fetch(`${API_BASE}/something`, { headers: { Authorization: `Bearer ${token}` } });
============================================================ */

const AuthContext = createContext(null);

const STORAGE_TOKEN_KEY = "cv_auth_token";
const STORAGE_USER_KEY = "cv_auth_user";
// Same convention as ProductPage.js. For local dev, put
// REACT_APP_API_BASE=http://localhost:3046/api in frontend/.env.local
const API_BASE =process.env.REACT_APP_API_BASE || "http://localhost:3046/api";

async function postJson(path, body, fallbackError) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || fallbackError);
  return data;
}

function readStoredSession() {
  try {
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem(STORAGE_USER_KEY) || "null");
    return token && user ? { token, user } : null;
  } catch {
    return null; // private browsing, or corrupted JSON
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isReady, setIsReady] = useState(false); // true once the initial session check has finished
  const [modalView, setModalView] = useState(null); // null (closed) | 'login' | 'signup' | 'forgot'
  const pendingActionRef = useRef(null);

  const persistSession = useCallback((nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    try {
      localStorage.setItem(STORAGE_TOKEN_KEY, nextToken);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(nextUser));
    } catch {
      // e.g. private browsing — session still works for this tab
    }
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
    } catch {
      // ignore
    }
  }, []);

  // On first load: show the stored session straight away, then confirm with
  // the server that the token is still valid. Only a 401 signs the user out —
  // a network error or a sleeping server shouldn't log anyone out.
  useEffect(() => {
    const stored = readStoredSession();
    if (!stored) {
      setIsReady(true);
      return;
    }
    setToken(stored.token);
    setUser(stored.user);

    let cancelled = false;
    fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${stored.token}` } })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) {
          clearSession();
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.user) persistSession(stored.token, data.user);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [clearSession, persistSession]);

  // Keep tabs in sync: logging in or out in one tab updates the others.
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

  // Called after any successful login / sign-up / reset.
  const completeAuth = useCallback(
    (data) => {
      persistSession(data.token, data.user);
      setModalView(null);
      // Run whatever action was waiting on login (e.g. "Buy now").
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

  // The main entry point for gating actions behind login (see file header).
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

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user),
    isReady,
    signup,
    login,
    requestPasswordReset,
    resetPassword,
    logout,
    openLogin,
    openSignup,
    closeLogin,
    requireAuth,
  };

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
