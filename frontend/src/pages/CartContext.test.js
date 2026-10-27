import { act, render, waitFor } from "@testing-library/react";
import { CartProvider, useCart } from "./CartContext";
import { useAuth } from "./AuthContext";
import { readStoredCart, writeStoredCart } from "../utils/cart";

jest.mock("./AuthContext", () => ({ useAuth: jest.fn() }));

const monthly = { productId: 7, planIndex: 0, planName: "1 Month", unitPrice: 5, name: "Tool" };
const saved = { productId: 9, planIndex: 0, planName: "Lifetime", quantity: 1, unitPrice: 20 };

let cart;
function Probe() {
  cart = useCart();
  return null;
}

function renderCart() {
  return render(
    <CartProvider>
      <Probe />
    </CartProvider>
  );
}

function accountApi(initial = []) {
  let stored = initial;
  return jest.fn(async (path, options = {}) => {
    if (path !== "/cart") throw new Error(`unexpected ${path}`);
    if (options.method === "PUT") stored = options.body.items;
    return { items: stored };
  });
}

const guest = (authRequest = jest.fn()) => ({ user: null, isReady: true, authRequest });
const signedIn = (authRequest, id = "u1") => ({ user: { id, email: `${id}@example.com` }, isReady: true, authRequest });

beforeEach(() => {
  localStorage.clear();
});

describe("CartProvider", () => {
  it("keeps a guest cart in this browser across reloads", () => {
    useAuth.mockReturnValue(guest());
    const { unmount } = renderCart();
    act(() => {
      cart.addItem(monthly);
      cart.addItem(monthly);
    });
    expect(cart.count).toBe(2);
    expect(readStoredCart()).toMatchObject({ owner: null, items: [{ productId: 7, quantity: 2 }] });

    unmount();
    renderCart();
    expect(cart.items).toEqual([{ ...monthly, quantity: 2 }]);
  });

  it("merges a guest cart into the account cart at login and saves it", async () => {
    const authRequest = accountApi([saved]);
    useAuth.mockReturnValue(guest());
    const { rerender } = renderCart();
    act(() => {
      cart.addItem(monthly);
    });

    useAuth.mockReturnValue(signedIn(authRequest));
    rerender(
      <CartProvider>
        <Probe />
      </CartProvider>
    );

    await waitFor(() => expect(cart.items).toHaveLength(2));
    await waitFor(() => expect(authRequest).toHaveBeenCalledWith("/cart", expect.objectContaining({ method: "PUT" })));
    const put = authRequest.mock.calls.find(([, o]) => o && o.method === "PUT")[1];
    expect(put.body.items.map((i) => i.productId)).toEqual([9, 7]);
    await waitFor(() => expect(readStoredCart()).toMatchObject({ owner: "u1", dirty: false }));
  });

  it("loads the saved cart on a page load with a stored session", async () => {
    writeStoredCart({ owner: "u1", items: [{ ...monthly, quantity: 1 }], dirty: false });
    const authRequest = accountApi([saved]);
    useAuth.mockReturnValue(signedIn(authRequest));
    renderCart();
    await waitFor(() => expect(cart.items.map((i) => i.productId)).toEqual([9]));
    expect(authRequest).not.toHaveBeenCalledWith("/cart", expect.objectContaining({ method: "PUT" }));
  });

  it("keeps unsaved changes made on this device over the saved cart", async () => {
    writeStoredCart({ owner: "u1", items: [{ ...monthly, quantity: 3 }], dirty: true });
    const authRequest = accountApi([saved]);
    useAuth.mockReturnValue(signedIn(authRequest));
    renderCart();
    await waitFor(() => expect(authRequest).toHaveBeenCalledWith("/cart", expect.objectContaining({ method: "PUT" })));
    expect(cart.items).toEqual([{ ...monthly, quantity: 3 }]);
  });

  it("removes an account's cart from this browser at logout", async () => {
    const authRequest = accountApi([saved]);
    useAuth.mockReturnValue(signedIn(authRequest));
    const { rerender } = renderCart();
    await waitFor(() => expect(cart.items).toHaveLength(1));

    useAuth.mockReturnValue(guest());
    rerender(
      <CartProvider>
        <Probe />
      </CartProvider>
    );
    expect(cart.items).toEqual([]);
    expect(readStoredCart().items).toEqual([]);
  });

  it("takes only what was paid for out of the cart", () => {
    useAuth.mockReturnValue(guest());
    renderCart();
    act(() => {
      cart.addItem(monthly, 3);
      cart.addItem({ ...monthly, planIndex: 1, planName: "12 Months", unitPrice: 40 });
    });
    act(() => cart.removeOrderedItems([{ productId: 7, planIndex: 4, planName: "1 Month", quantity: 2 }]));
    expect(cart.items.map((i) => [i.planName, i.quantity])).toEqual([
      ["1 Month", 1],
      ["12 Months", 1],
    ]);
    act(() => cart.removeOrderedItems([{ productId: 7, planName: "12 Months", quantity: 1 }]));
    expect(cart.items.map((i) => i.planName)).toEqual(["1 Month"]);
  });

  it("doesn't drop a stored account cart before the session has been restored", () => {
    writeStoredCart({ owner: "u1", items: [{ ...monthly, quantity: 1 }], dirty: false });
    useAuth.mockReturnValue({ user: null, isReady: false, authRequest: jest.fn() });
    renderCart();
    expect(cart.items).toHaveLength(1);
    expect(readStoredCart().items).toHaveLength(1);
  });

  it("says so when the account cart can't be saved, and keeps it on this device", async () => {
    const authRequest = jest.fn(async (path, options = {}) => {
      if (options.method === "PUT") throw Object.assign(new Error("down"), { status: 0 });
      return { items: [] };
    });
    useAuth.mockReturnValue(signedIn(authRequest));
    renderCart();
    await waitFor(() => expect(authRequest).toHaveBeenCalledTimes(1));
    act(() => {
      cart.addItem(monthly);
    });
    await waitFor(() => expect(cart.syncError).toMatch(/still saved on this device/));
    expect(readStoredCart()).toMatchObject({ owner: "u1", dirty: true, items: [{ productId: 7 }] });
  });
});
