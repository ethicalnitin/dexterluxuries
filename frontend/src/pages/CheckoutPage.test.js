import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useParams } from "react-router-dom";
import CheckoutPage from "./CheckoutPage";
import { useAuth } from "./AuthContext";
import { useCart } from "./CartContext";

jest.mock("./AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("./CartContext", () => ({ useCart: jest.fn() }));

const jsonResponse = (status, body) =>
  Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) });

const line = (overrides = {}) => ({
  productId: 7,
  planIndex: 1,
  planName: "12 Months",
  productName: "Test Product",
  image: "",
  quantity: 2,
  unitPrice: 15,
  unitPriceInr: 1485,
  lineTotalInr: 2970,
  status: "ok",
  ...overrides,
});
const quoteOf = (lines) => ({
  items: lines,
  subtotal: lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
  totalInr: lines.filter((l) => l.status === "ok").reduce((s, l) => s + l.lineTotalInr, 0),
  allAvailable: lines.every((l) => l.status === "ok"),
});

const cartItems = [{ productId: 7, planIndex: 1, planName: "12 Months", quantity: 2, name: "Test Product" }];

function OrderProbe() {
  const { id } = useParams();
  return <p data-testid="order-page">order {id}</p>;
}

function renderCheckout(state) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/checkout", state }]}>
      <Routes>
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders/:id" element={<OrderProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

let authRequest;
const placeButton = () => screen.getByRole("button", { name: /^Place order/ });
const orderCalls = () => authRequest.mock.calls.filter(([path]) => path === "/orders");

beforeEach(() => {
  global.fetch = jest.fn(() => jsonResponse(200, quoteOf([line()])));
  authRequest = jest.fn(async () => ({ order: { id: "ord1", orderRef: "DX-ABC123" } }));
  useAuth.mockReturnValue({ user: { id: "u1", email: "member@example.com" }, authRequest });
  useCart.mockReturnValue({ items: cartItems, loading: false });
});

describe("CheckoutPage", () => {
  it("says so when there's nothing to check out", () => {
    useCart.mockReturnValue({ items: [], loading: false });
    renderCheckout();
    expect(screen.getByText("Nothing to check out")).toBeInTheDocument();
  });

  it("shows the server's prices and total, and the account email for delivery", async () => {
    renderCheckout();
    expect(await screen.findByText("Test Product")).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Order total" })).toHaveTextContent("₹2,970");
    expect(screen.getByLabelText("Deliver access to")).toHaveValue("member@example.com");
    expect(placeButton()).toHaveTextContent("Place order — ₹2,970");
  });

  it("places the order with the confirmed total, then opens it", async () => {
    renderCheckout();
    await waitFor(() => expect(placeButton()).toBeEnabled());
    fireEvent.click(placeButton());
    fireEvent.click(placeButton());

    expect(await screen.findByTestId("order-page")).toHaveTextContent("order ord1");
    expect(orderCalls()).toHaveLength(1);
    const [, options] = orderCalls()[0];
    expect(options.method).toBe("POST");
    expect(options.body).toMatchObject({
      items: [{ productId: 7, planIndex: 1, planName: "12 Months", quantity: 2 }],
      email: "member@example.com",
      expectedTotalInr: 2970,
      source: "cart",
    });
    expect(options.body.idempotencyKey).toEqual(expect.any(String));
  });

  it("retries with the same checkout key, so a lost response can't create two orders", async () => {
    authRequest
      .mockImplementationOnce(async () => {
        throw Object.assign(new Error("Can't reach the server."), { status: 0 });
      })
      .mockImplementationOnce(async () => ({ order: { id: "ord2" } }));
    renderCheckout();
    await waitFor(() => expect(placeButton()).toBeEnabled());
    fireEvent.click(placeButton());
    expect(await screen.findByText("Can't reach the server.")).toBeInTheDocument();
    fireEvent.click(placeButton());
    await screen.findByTestId("order-page");
    const [first, second] = orderCalls().map(([, o]) => o.body.idempotencyKey);
    expect(second).toBe(first);
  });

  it("shows the new total when prices changed, and places the order at that total next time", async () => {
    const newQuote = quoteOf([line({ unitPrice: 16, unitPriceInr: 1584, lineTotalInr: 3168 })]);
    authRequest.mockImplementationOnce(async () => {
      throw Object.assign(new Error("Prices have changed since you reviewed your order."), { status: 409, data: { code: "TOTAL_CHANGED", quote: newQuote } });
    });
    renderCheckout();
    await waitFor(() => expect(placeButton()).toBeEnabled());
    fireEvent.click(placeButton());

    expect(await screen.findByText(/Prices have changed/)).toBeInTheDocument();
    expect(placeButton()).toHaveTextContent("₹3,168");
    fireEvent.click(placeButton());
    await screen.findByTestId("order-page");
    expect(orderCalls()[1][1].body.expectedTotalInr).toBe(3168);
  });

  it("won't place an order with unavailable items", async () => {
    global.fetch.mockReturnValue(jsonResponse(200, quoteOf([line({ status: "unavailable" })])));
    renderCheckout();
    expect(await screen.findByText("Out of stock right now")).toBeInTheDocument();
    expect(placeButton()).toBeDisabled();
    expect(screen.getByRole("link", { name: "Update your cart" })).toHaveAttribute("href", "/cart");
  });

  it("checks the delivery email before placing the order", async () => {
    renderCheckout();
    await waitFor(() => expect(placeButton()).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Deliver access to"), { target: { value: "nope" } });
    fireEvent.click(placeButton());
    expect(screen.getByText("Enter the email address that should receive access.")).toBeInTheDocument();
    expect(orderCalls()).toHaveLength(0);
  });

  it("checks out a single 'Buy now' plan without the cart", async () => {
    const state = { items: [{ productId: 9, planIndex: 0, planName: "1 Month", quantity: 1 }], source: "buy_now" };
    global.fetch.mockReturnValue(jsonResponse(200, quoteOf([line({ productId: 9, planIndex: 0, planName: "1 Month", quantity: 1, lineTotalInr: 495 })])));
    renderCheckout(state);
    await waitFor(() => expect(placeButton()).toBeEnabled());
    expect(JSON.parse(global.fetch.mock.calls[0][1].body).items).toEqual(state.items);
    expect(screen.getByRole("link", { name: /Back to product/ })).toHaveAttribute("href", "/product/9");
    fireEvent.click(placeButton());
    await screen.findByTestId("order-page");
    expect(orderCalls()[0][1].body.source).toBe("buy_now");
  });

  it("offers a retry when prices can't be checked", async () => {
    global.fetch.mockReturnValueOnce(jsonResponse(500, { error: "Couldn't check today's prices. Try again." }));
    renderCheckout();
    expect(await screen.findByText("We couldn't price your order")).toBeInTheDocument();
    expect(placeButton()).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(placeButton()).toBeEnabled());
  });
});
