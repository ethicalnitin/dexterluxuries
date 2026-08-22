import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import LoginModal from "./LoginModal";

/* ============================================================
   AUTH CONTEXT — email + OTP, no passwords.

   Wrap your whole app in <AuthProvider> once, near the root
   (e.g. in App.jsx, outside or inside the router):

     <AuthProvider>
       <BrowserRouter>
         <Routes>...</Routes>
       </BrowserRouter>
     </AuthProvider>

   Then anywhere you need to gate an action behind login — most
   importantly a "Buy now" / "Checkout" button — do:

     const { requireAuth } = useAuth();
     const handleBuyNow = () => {
       requireAuth(() => {
         // this only runs once the user is verified
         startCheckout(product);
       });
     };

   IMPORTANT — the backend now actually enforces login on
   /api/orders/notify and /api/deposit. Any fetch call to those
   endpoints must include the token:

     const { token } = useAuth();
     fetch("https://chartvault.shoplocalhost:3046/api/orders/notify", {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         Authorization: `Bearer ${token}`,
       },
       body: JSON.stringify({ ... }),
     });

   Requests without that header will get a 401 from the server.
============================================================ */

const AuthContext = createContext(null);

const STORAGE_TOKEN_KEY = "cv_auth_token";
const STORAGE_USER_KEY = "cv_auth_user";
const API_BASE = "http://localhost:3046/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isReady, setIsReady] = useState(false); // true once the initial session check has finished
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  // On first load: read whatever's in localStorage, then confirm with the
  // server that the token is still valid (it may have expired or the OTP
  // secret may have rotated) before trusting it.
  useEffect(() => {
    const restore = async () => {
      let storedToken = null;
      let storedUser = null;
      try {
        storedToken = localStorage.getItem(STORAGE_TOKEN_KEY);
        storedUser = localStorage.getItem(STORAGE_USER_KEY);
      } catch {
        // ignore
      }

      if (!storedToken || !storedUser) {
        setIsReady(true);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (!res.ok) throw new Error("Session invalid");
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        clearSession();
      } finally {
        setIsReady(true);
      }
    };

    restore();
  }, [clearSession]);

  const sendOtp = useCallback(async (email) => {
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Couldn't send the code. Try again.");
    }
    return true;
  }, []);

  const verifyOtp = useCallback(
    async (email, otp) => {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "That code didn't work. Check it and try again.");
      }
      const data = await res.json();
      persistSession(data.token, data.user);

      // Run whatever action was waiting on login (e.g. "Buy now"), then close.
      if (pendingActionRef.current) {
        const action = pendingActionRef.current;
        pendingActionRef.current = null;
        action();
      }
      setIsModalOpen(false);
      return data;
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const openLogin = useCallback(() => {
    pendingActionRef.current = null;
    setIsModalOpen(true);
  }, []);

  const closeLogin = useCallback(() => {
    pendingActionRef.current = null;
    setIsModalOpen(false);
  }, []);

  // The main entry point for gating purchases (see file header for usage).
  const requireAuth = useCallback(
    (action) => {
      if (user) {
        action();
        return;
      }
      pendingActionRef.current = action;
      setIsModalOpen(true);
    },
    [user]
  );

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user),
    isReady,
    sendOtp,
    verifyOtp,
    logout,
    openLogin,
    closeLogin,
    requireAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginModal isOpen={isModalOpen} onClose={closeLogin} />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an <AuthProvider>");
  return ctx;
};