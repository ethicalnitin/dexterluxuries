import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import OrderDetailsPage from "./OrderDetailsPage";
import { useAuth } from "./AuthContext";
import { useCart } from "./CartContext";

jest.mock("./AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("./CartContext", () => ({ useCart: jest.fn() }));

const mockMethodListRender = jest.fn();
jest.mock("../components/payment/PaymentMethodList", () => {
  const React = require("react");
  const Actual = jest.requireActual("../components/payment/PaymentMethodList").default;
  return {
    __esModule: true,
    default: (props) => {
      mockMethodListRender();
      return React.createElement(Actual, props);
    },
  };
});

const NOW = Date.now();
const makeOrder = (overrides = {}) => ({
  id: "ord1",
  orderRef: "DX-ABC123",
  status: "pending_payment",
  email: "buyer@example.com",
  source: "cart",
  items: [
    { productId: 7, productName: "Test Product", planIndex: 1, planName: "12 Months", quantity: 2, unitPrice: 15, unitPriceInr: 1485, lineTotalInr: 2970 },
    { productId: 8, productName: "Other Tool", planIndex: 0, planName: "3 Months", quantity: 1, unitPrice: 5, unitPriceInr: 495, lineTotalInr: 495 },
  ],
  itemCount: 3,
  subtotal: 35,
  totalInr: 3465,
  createdAt: new Date(NOW).toISOString(),
  expiresAt: new Date(NOW + 15 * 60 * 1000).toISOString(),
  payment: { method: "UPI", utr: null, submittedAt: null, verifiedAt: null, failureReason: null, attemptsLeft: 3 },
  cancelledAt: null,
  cancelReason: null,
  fulfilledAt: null,
  history: [{ status: "pending_payment", at: new Date(NOW).toISOString() }],
  ...overrides,
});

let authRequest;
let removeOrderedItems;
let server;

function renderOrder() {
  return render(
    <MemoryRouter initialEntries={["/orders/ord1"]}>
      <Routes>
        <Route path="/orders/:id" element={<OrderDetailsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

const utrInput = () => screen.findByLabelText("UTR number");
const submitButton = () => screen.getByRole("button", { name: /I've paid/ });
const fail = (status, message, data) => Object.assign(new Error(message), { status, data });

beforeAll(() => {
  window.scrollTo = () => {};
});

beforeEach(() => {
  server = makeOrder();
  authRequest = jest.fn(async (path, options = {}) => {
    if (path === "/orders/ord1" && !options.method) {
      if (!server) throw fail(404, "Order not found.");
      return { order: server };
    }
    if (path === "/orders/ord1/payment") {
      server = makeOrder({ source: server.source, status: "verifying", expiresAt: null, payment: { ...server.payment, utr: options.body.utr, attemptsLeft: 2 } });
      return { order: server };
    }
    if (path === "/orders/ord1/cancel") {
      server = makeOrder({ status: "cancelled", cancelReason: "customer", expiresAt: null });
      return { order: server };
    }
    throw new Error(`unexpected ${path}`);
  });
  removeOrderedItems = jest.fn();
  useAuth.mockReturnValue({ authRequest });
  useCart.mockReturnValue({ removeOrderedItems });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("OrderDetailsPage", () => {
  it("shows an unpaid order as a payment page", async () => {
    renderOrder();
    await utrInput();
    expect(screen.getByRole("heading", { name: "Order DX-ABC123" })).toBeInTheDocument();
    expect(screen.getByText("Awaiting payment")).toBeInTheDocument();
    expect(screen.getByText(/Order placed\./)).toBeInTheDocument();
    const summary = screen.getByRole("complementary", { name: "Order summary" });
    expect(summary).toHaveTextContent("₹3,465");
    expect(summary).toHaveTextContent("Test Product12 Months × 2₹2,970");
    expect(summary).toHaveTextContent("buyer@example.com");
    expect(screen.getByText("Price held for")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pay ₹3,465 with UPI" })).toBeInTheDocument();
  });

  it("submits the UTR, confirms it, and takes the paid items out of the cart", async () => {
    renderOrder();
    const input = await utrInput();
    expect(submitButton()).toBeDisabled();
    fireEvent.change(input, { target: { value: "12-34 5678 9012 99" } });
    expect(input).toHaveValue("123456789012");
    fireEvent.click(submitButton());

    expect(await screen.findByRole("heading", { name: "Payment submitted — we're checking it" })).toBeInTheDocument();
    expect(screen.getByText("123456789012")).toBeInTheDocument();
    expect(authRequest).toHaveBeenCalledWith("/orders/ord1/payment", expect.objectContaining({ method: "POST", body: { utr: "123456789012" } }));
    expect(removeOrderedItems).toHaveBeenCalledWith(server.items);
  });

  it("leaves the cart alone for a 'Buy now' order", async () => {
    server = makeOrder({ source: "buy_now" });
    renderOrder();
    fireEvent.change(await utrInput(), { target: { value: "123456789012" } });
    fireEvent.click(submitButton());
    await screen.findByRole("heading", { name: /Payment submitted/ });
    expect(removeOrderedItems).not.toHaveBeenCalled();
  });

  it("keeps the buyer on the form when the UTR is rejected", async () => {
    authRequest.mockImplementation(async (path) => {
      if (path === "/orders/ord1/payment") throw fail(409, "This UTR has already been used for a payment.");
      return { order: server };
    });
    renderOrder();
    fireEvent.change(await utrInput(), { target: { value: "123456789012" } });
    fireEvent.click(submitButton());
    expect(await screen.findByText("This UTR has already been used for a payment.")).toBeInTheDocument();
    expect(screen.getByLabelText("UTR number")).toHaveValue("123456789012");
    expect(removeOrderedItems).not.toHaveBeenCalled();
  });

  it("tells the buyer their UTR wasn't recorded when the server can't be reached", async () => {
    authRequest.mockImplementation(async (path) => {
      if (path === "/orders/ord1/payment") throw fail(0, "Can't reach the server.");
      return { order: server };
    });
    renderOrder();
    fireEvent.change(await utrInput(), { target: { value: "123456789012" } });
    fireEvent.click(submitButton());
    expect(await screen.findByText(/your UTR \(123456789012\) wasn't recorded yet/)).toBeInTheDocument();
  });

  it("shows a failed check with the reason, and lets the buyer correct the UTR", async () => {
    server = makeOrder({ status: "payment_failed", expiresAt: null, payment: { method: "UPI", utr: "111111111111", failureReason: "No transfer with this UTR", attemptsLeft: 2 } });
    renderOrder();
    await utrInput();
    expect(screen.getByText(/No transfer with this UTR/)).toHaveTextContent("2 tries left");
    expect(screen.getByRole("heading", { name: "Enter the correct UTR" })).toBeInTheDocument();
  });

  it("stops offering the form when no attempts are left", async () => {
    server = makeOrder({ status: "payment_failed", expiresAt: null, payment: { method: "UPI", utr: "1", failureReason: "Not found", attemptsLeft: 0 } });
    renderOrder();
    expect(await screen.findByRole("button", { name: "Message us on WhatsApp" })).toBeInTheDocument();
    expect(screen.queryByLabelText("UTR number")).not.toBeInTheDocument();
  });

  it.each([
    ["paid", { status: "paid", payment: { utr: "1", attemptsLeft: 2 } }, "Payment confirmed"],
    ["fulfilled", { status: "fulfilled", fulfilledAt: new Date(NOW).toISOString() }, "Delivered"],
    ["cancelled by the buyer", { status: "cancelled", cancelReason: "customer" }, "Order cancelled"],
    ["expired", { status: "cancelled", cancelReason: "expired" }, "Payment window ended"],
  ])("shows a %s order's status", async (_, overrides, heading) => {
    server = makeOrder({ expiresAt: null, ...overrides, payment: { ...makeOrder().payment, ...(overrides.payment || {}) } });
    renderOrder();
    expect(await screen.findByRole("heading", { name: heading })).toBeInTheDocument();
    expect(screen.queryByLabelText("UTR number")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel order" })).not.toBeInTheDocument();
  });

  it("cancels an unpaid order after asking", async () => {
    renderOrder();
    await utrInput();
    fireEvent.click(screen.getByRole("button", { name: "Cancel order" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, cancel order" }));
    expect(await screen.findByRole("heading", { name: "Order cancelled" })).toBeInTheDocument();
    expect(authRequest).toHaveBeenCalledWith("/orders/ord1/cancel", expect.objectContaining({ method: "POST" }));
  });

  it("says when the order doesn't exist or isn't the customer's", async () => {
    server = null;
    renderOrder();
    expect(await screen.findByText("Order not found")).toBeInTheDocument();
  });

  it("picks up the admin's decision while a payment is being checked", async () => {
    jest.useFakeTimers();
    server = makeOrder({ status: "verifying", expiresAt: null, payment: { method: "UPI", utr: "123456789012", attemptsLeft: 2 } });
    renderOrder();
    await screen.findByRole("heading", { name: /Payment submitted/ });

    server = makeOrder({ status: "paid", expiresAt: null, payment: { method: "UPI", utr: "123456789012", attemptsLeft: 2 } });
    await act(async () => {
      jest.advanceTimersByTime(30 * 1000);
    });
    expect(await screen.findByRole("heading", { name: "Payment confirmed" })).toBeInTheDocument();
  });

  it("refreshes the order when the payment window closes", async () => {
    jest.useFakeTimers();
    server = makeOrder({ expiresAt: new Date(Date.now() + 5000).toISOString() });
    renderOrder();
    await screen.findByLabelText("UTR number");
    server = makeOrder({ status: "cancelled", cancelReason: "expired", expiresAt: null });
    await act(async () => {
      jest.advanceTimersByTime(6000);
    });
    expect(await screen.findByRole("heading", { name: "Payment window ended" })).toBeInTheDocument();
  });

  it("doesn't re-render the whole page every second while the timer runs", async () => {
    jest.useFakeTimers();
    renderOrder();
    await screen.findByLabelText("UTR number");
    const before = mockMethodListRender.mock.calls.length;
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(screen.getByText(/14:5\d/)).toBeInTheDocument();
    expect(mockMethodListRender.mock.calls.length).toBe(before);
  });
});
