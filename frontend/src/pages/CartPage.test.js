import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import CartPage from "./CartPage";
import { CartProvider } from "./CartContext";
import { useAuth } from "./AuthContext";
import { readStoredCart, writeStoredCart } from "../utils/cart";

jest.mock("./AuthContext", () => ({ useAuth: jest.fn() }));

const RATE = 99;
const catalog = {
  7: { name: "Test Product", plans: [{ name: "3 Months", price: 5 }, { name: "12 Months", price: 15 }] },
  8: { name: "Sold Out Tool", stock: false, plans: [{ name: "1 Month", price: 3 }] },
};

function quote(items) {
  const lines = items.map(({ productId, planIndex, planName, quantity }) => {
    const product = catalog[productId];
    const plan = product && product.plans[planIndex];
    if (!plan) return { productId, planIndex, planName, quantity, status: "not_found" };
    const unitPriceInr = Math.round(plan.price * RATE);
    return {
      productId,
      planIndex,
      planName: plan.name,
      productName: product.name,
      image: "",
      quantity,
      unitPrice: plan.price,
      unitPriceInr,
      lineTotalInr: unitPriceInr * quantity,
      status: product.stock === false ? "unavailable" : "ok",
    };
  });
  const ok = lines.filter((l) => l.status === "ok");
  return {
    items: lines,
    subtotal: ok.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
    totalInr: ok.reduce((s, l) => s + l.lineTotalInr, 0),
    allAvailable: lines.length > 0 && ok.length === lines.length,
  };
}

const jsonResponse = (status, body) =>
  Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) });

const quoteBodies = () =>
  global.fetch.mock.calls.filter(([url]) => String(url).endsWith("/cart/quote")).map(([, o]) => JSON.parse(o.body).items);

function CheckoutProbe() {
  const { pathname } = useLocation();
  return <p data-testid="checkout-page">{pathname}</p>;
}

function renderCartPage() {
  return render(
    <CartProvider>
      <MemoryRouter initialEntries={["/cart"]}>
        <Routes>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutProbe />} />
          <Route path="/" element={<p>Store home</p>} />
        </Routes>
      </MemoryRouter>
    </CartProvider>
  );
}

const seed = (items) => writeStoredCart({ owner: null, items, dirty: false });
const yearly = { productId: 7, planIndex: 1, planName: "12 Months", quantity: 2, unitPrice: 15, name: "Test Product" };
const quarterly = { productId: 7, planIndex: 0, planName: "3 Months", quantity: 1, unitPrice: 5, name: "Test Product" };
const summary = () => screen.getByRole("complementary", { name: "Cart total" });
const checkoutButton = () => screen.getByRole("button", { name: /^(Checkout|Log in to check out)/ });
let requireAuth;

beforeEach(() => {
  localStorage.clear();
  requireAuth = jest.fn();
  useAuth.mockReturnValue({ user: null, isReady: true, isAuthenticated: false, authRequest: jest.fn(), requireAuth });
  global.fetch = jest.fn((url, options) => jsonResponse(200, quote(JSON.parse(options.body).items)));
});

describe("CartPage", () => {
  it("shows an empty state with a way back to the store", () => {
    renderCartPage();
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: /Browse products/ }));
    expect(screen.getByText("Store home")).toBeInTheDocument();
  });

  it("lists each line with server prices and totals", async () => {
    seed([yearly, quarterly]);
    renderCartPage();
    expect(screen.getByRole("heading", { name: "Your cart" })).toBeInTheDocument();
    expect(screen.getByText("3 items")).toBeInTheDocument();
    await waitFor(() => expect(summary()).toHaveTextContent("₹3,465"));
    expect(summary()).toHaveTextContent("$35.00");
    expect(screen.getByText("12 Months · $15.00 each")).toBeInTheDocument();
    expect(checkoutButton()).toBeEnabled();
  });

  it("re-prices when a quantity changes and stops at the maximum", async () => {
    seed([{ ...yearly, quantity: 4 }]);
    renderCartPage();
    await waitFor(() => expect(summary()).toHaveTextContent("₹5,940"));

    fireEvent.click(screen.getByRole("button", { name: "Increase quantity of Test Product" }));
    await waitFor(() => expect(summary()).toHaveTextContent("₹7,425"));
    expect(quoteBodies().at(-1)).toEqual([{ productId: 7, planIndex: 1, planName: "12 Months", quantity: 5 }]);
    expect(screen.getByRole("button", { name: "Increase quantity of Test Product" })).toBeDisabled();
    expect(readStoredCart().items[0].quantity).toBe(5);

    fireEvent.click(screen.getByRole("button", { name: "Decrease quantity of Test Product" }));
    await waitFor(() => expect(summary()).toHaveTextContent("₹5,940"));
  });

  it("removes a line, with undo", async () => {
    seed([yearly]);
    renderCartPage();
    await waitFor(() => expect(summary()).toHaveTextContent("₹2,970"));

    fireEvent.click(screen.getByRole("button", { name: "Remove Test Product from cart" }));
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
    expect(screen.getByText("Removed Test Product from your cart.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Undo/ }));
    await waitFor(() => expect(summary()).toHaveTextContent("₹2,970"));
    expect(readStoredCart().items).toHaveLength(1);
  });

  it("blocks checkout while an item is unavailable", async () => {
    seed([yearly, { productId: 8, planIndex: 0, planName: "1 Month", quantity: 1, unitPrice: 3, name: "Sold Out Tool" }]);
    renderCartPage();
    expect(await screen.findByText(/Out of stock right now/)).toBeInTheDocument();
    expect(screen.getByText("Remove the items marked unavailable to check out.")).toBeInTheDocument();
    expect(checkoutButton()).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Remove Sold Out Tool from cart" }));
    await waitFor(() => expect(checkoutButton()).toBeEnabled());
  });

  it("tells the shopper when prices changed since they added an item", async () => {
    seed([{ ...yearly, unitPrice: 10 }]);
    renderCartPage();
    expect(await screen.findByText("Price changed from $10.00")).toBeInTheDocument();
    expect(screen.getByText(/totals use today's prices/)).toBeInTheDocument();
  });

  it("offers a retry when prices can't be checked", async () => {
    global.fetch.mockReturnValueOnce(jsonResponse(500, { error: "Couldn't check today's prices. Try again." }));
    seed([yearly]);
    renderCartPage();
    expect(await screen.findByText(/Couldn't check today's prices/)).toBeInTheDocument();
    expect(checkoutButton()).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(summary()).toHaveTextContent("₹2,970"));
    expect(checkoutButton()).toBeEnabled();
  });

  it("asks a guest to log in before checkout, then continues to it", async () => {
    seed([yearly, quarterly]);
    renderCartPage();
    await waitFor(() => expect(checkoutButton()).toBeEnabled());
    expect(checkoutButton()).toHaveTextContent("Log in to check out");
    fireEvent.click(checkoutButton());

    expect(requireAuth).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("checkout-page")).not.toBeInTheDocument();
    act(() => requireAuth.mock.calls[0][0]());
    expect(await screen.findByTestId("checkout-page")).toHaveTextContent("/checkout");
  });

  it("goes straight to checkout when signed in", async () => {
    useAuth.mockReturnValue({ user: { id: "u1" }, isReady: true, isAuthenticated: true, authRequest: jest.fn(async () => ({ items: [] })), requireAuth: (action) => action() });
    seed([yearly]);
    renderCartPage();
    await waitFor(() => expect(checkoutButton()).toBeEnabled());
    expect(checkoutButton()).toHaveTextContent("Checkout");
    fireEvent.click(checkoutButton());
    expect(await screen.findByTestId("checkout-page")).toBeInTheDocument();
  });
});
