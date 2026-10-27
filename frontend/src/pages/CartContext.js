import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  CART_STORAGE_KEY,
  addLine,
  cartCount,
  clearStoredCart,
  lineKey,
  mergeCarts,
  readStoredCart,
  removeLine,
  sanitizeItems,
  setLineQuantity,
  toSavedItems,
  writeStoredCart,
} from "../utils/cart";

const CartContext = createContext(null);

const SAVE_DELAY_MS = 400;

export function CartProvider({ children }) {
  const { user, isReady, authRequest } = useAuth();
  const userId = user?.id || null;

  const [items, setItems] = useState(() => readStoredCart().items);
  const [loadingAccountCart, setLoadingAccountCart] = useState(false);
  const [syncError, setSyncError] = useState("");

  const itemsRef = useRef(items);
  const ownerRef = useRef(readStoredCart().owner);
  const authRequestRef = useRef(authRequest);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    authRequestRef.current = authRequest;
  }, [authRequest]);

  const saveToAccount = useCallback((next) => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const owner = ownerRef.current;
      if (!owner) return;
      authRequestRef
        .current("/cart", { method: "PUT", body: { items: toSavedItems(next) } })
        .then(() => {
          if (ownerRef.current === owner && itemsRef.current === next) writeStoredCart({ owner, items: next, dirty: false });
          setSyncError("");
        })
        .catch((err) => {
          if (err.status !== 401) setSyncError("Couldn't save your cart to your account. It's still saved on this device.");
        });
    }, SAVE_DELAY_MS);
  }, []);

  const commit = useCallback(
    (next, { save = true } = {}) => {
      itemsRef.current = next;
      setItems(next);
      const owner = ownerRef.current;
      const dirty = Boolean(owner) && (save || readStoredCart().dirty);
      writeStoredCart({ owner, items: next, dirty });
      if (owner && save) saveToAccount(next);
    },
    [saveToAccount]
  );

  useEffect(() => {
    if (userId || !isReady) return;
    clearTimeout(saveTimerRef.current);
    if (ownerRef.current) {
      ownerRef.current = null;
      clearStoredCart();
      itemsRef.current = [];
      setItems([]);
    }
    setLoadingAccountCart(false);
    setSyncError("");
  }, [userId, isReady]);

  useEffect(() => {
    if (!userId) return undefined;

    let cancelled = false;
    setLoadingAccountCart(true);
    authRequestRef
      .current("/cart")
      .then((data) => {
        if (cancelled) return;
        const saved = sanitizeItems(data && data.items);
        const local = readStoredCart();

        let next;
        let save;
        if (local.owner === userId && local.dirty) {
          next = local.items;
          save = true;
        } else if (local.owner === userId) {
          const snapshots = new Map(local.items.map((item) => [lineKey(item), item]));
          next = saved.map((item) => ({ ...snapshots.get(lineKey(item)), ...item }));
          save = false;
        } else if (!local.owner) {
          next = mergeCarts(saved, local.items);
          save = local.items.length > 0;
        } else {
          next = saved;
          save = false;
        }
        ownerRef.current = userId;
        commit(next, { save });
        setSyncError("");
      })
      .catch((err) => {
        if (!cancelled && err.status !== 401) {
          setSyncError("Couldn't load the cart saved to your account. Showing the cart on this device.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingAccountCart(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, commit]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== CART_STORAGE_KEY) return;
      const stored = readStoredCart();
      ownerRef.current = stored.owner;
      itemsRef.current = stored.items;
      setItems(stored.items);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => () => clearTimeout(saveTimerRef.current), []);

  const addItem = useCallback(
    (line, quantity = 1) => {
      const result = addLine(itemsRef.current, line, quantity);
      if (result.added > 0) commit(result.items);
      return result;
    },
    [commit]
  );

  const setQuantity = useCallback((key, quantity) => commit(setLineQuantity(itemsRef.current, key, quantity)), [commit]);

  const removeItem = useCallback((key) => commit(removeLine(itemsRef.current, key)), [commit]);

  const restoreItem = useCallback(
    (item, index) => {
      if (itemsRef.current.some((existing) => lineKey(existing) === lineKey(item))) return;
      const next = [...itemsRef.current];
      next.splice(Math.min(index, next.length), 0, item);
      commit(next);
    },
    [commit]
  );

  const clearCart = useCallback(() => commit([]), [commit]);

  const removeOrderedItems = useCallback(
    (orderItems) => {
      const ordered = new Map();
      orderItems.forEach((line) => {
        const key = `${line.productId}:${line.planName}`;
        ordered.set(key, (ordered.get(key) || 0) + line.quantity);
      });
      const next = itemsRef.current
        .map((item) => {
          const key = `${item.productId}:${item.planName}`;
          const paid = ordered.get(key) || 0;
          if (!paid) return item;
          ordered.set(key, Math.max(0, paid - item.quantity));
          return { ...item, quantity: item.quantity - paid };
        })
        .filter((item) => item.quantity > 0);
      if (next.length !== itemsRef.current.length || next.some((item, i) => item !== itemsRef.current[i])) commit(next);
    },
    [commit]
  );

  const syncFromQuote = useCallback(
    (quoteLines, { acceptPrices = false } = {}) => {
      const current = itemsRef.current;
      if (!Array.isArray(quoteLines) || quoteLines.length !== current.length) return;
      let pricesChanged = false;
      const next = current.map((item, i) => {
        const line = quoteLines[i];
        if (!line || line.productId !== item.productId || line.status === "not_found") return item;
        const updated = { ...item, name: line.productName, image: line.image };
        if (acceptPrices) {
          if (updated.unitPrice !== line.unitPrice || updated.planIndex !== line.planIndex || updated.planName !== line.planName) {
            pricesChanged = true;
          }
          Object.assign(updated, { unitPrice: line.unitPrice, planIndex: line.planIndex, planName: line.planName });
        }
        return updated;
      });
      commit(next, { save: pricesChanged });
    },
    [commit]
  );

  const value = useMemo(
    () => ({
      items,
      count: cartCount(items),
      loading: loadingAccountCart,
      syncError,
      addItem,
      setQuantity,
      removeItem,
      restoreItem,
      clearCart,
      removeOrderedItems,
      syncFromQuote,
    }),
    [items, loadingAccountCart, syncError, addItem, setQuantity, removeItem, restoreItem, clearCart, removeOrderedItems, syncFromQuote]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a <CartProvider>");
  return ctx;
};
