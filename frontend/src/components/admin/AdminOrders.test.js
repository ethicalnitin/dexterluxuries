import { render, screen, fireEvent, within } from "@testing-library/react";
import AdminOrders from "./AdminOrders";
import { useAuth } from "../../pages/AuthContext";

jest.mock("../../pages/AuthContext", () => ({ useAuth: jest.fn() }));

const order = (id, status, overrides = {}) => ({
  id,
  orderRef: `DX-${id}`,
  status,
  email: "buyer@example.com",
  account: { email: "account@example.com" },
  items: [{ productId: 7, productName: "Test Product", planName: "12 Months", quantity: 2 }],
  totalInr: 2970,
  createdAt: "2026-10-20T10:00:00.000Z",
  payment: { utr: "123456789012", failureReason: null },
  ...overrides,
});

let authRequest;
let lists;

beforeEach(() => {
  lists = { verifying: [order("V1", "verifying")], paid: [order("P1", "paid")] };
  authRequest = jest.fn(async (path, options = {}) => {
    if (!options.method) {
      const status = new URLSearchParams(path.split("?")[1]).get("status") || "all";
      return { orders: lists[status] || [] };
    }
    const id = path.split("/")[3];
    return { order: order(id, options.body.status, { payment: { utr: "123456789012", failureReason: options.body.reason || null } }) };
  });
  useAuth.mockReturnValue({ authRequest });
});

describe("AdminOrders", () => {
  it("lists payments to check and records a confirmed one", async () => {
    render(<AdminOrders onUseForDelivery={jest.fn()} />);
    const card = await screen.findByRole("listitem", { name: "Order DX-V1" });
    expect(card).toHaveTextContent("123456789012");
    expect(card).toHaveTextContent("Test Product — 12 Months × 2");
    expect(card).toHaveTextContent("account@example.com");

    fireEvent.click(within(card).getByRole("button", { name: /Payment received/ }));
    expect(await screen.findByText("DX-V1: payment confirmed.")).toBeInTheDocument();
    expect(authRequest).toHaveBeenCalledWith("/admin/orders/V1/status", expect.objectContaining({ method: "POST", body: { status: "paid" } }));
    expect(screen.queryByText("DX-V1")).not.toBeInTheDocument();
  });

  it("records a payment that wasn't received, with the reason the customer sees", async () => {
    render(<AdminOrders onUseForDelivery={jest.fn()} />);
    const card = await screen.findByRole("listitem", { name: "Order DX-V1" });
    fireEvent.click(within(card).getByRole("button", { name: /Not received/ }));
    fireEvent.change(within(card).getByLabelText("Reason shown to the customer"), { target: { value: "Amount was short" } });
    fireEvent.click(within(card).getByRole("button", { name: "Mark not received" }));
    await screen.findByText("DX-V1: payment not found.");
    expect(authRequest).toHaveBeenCalledWith(
      "/admin/orders/V1/status",
      expect.objectContaining({ body: { status: "payment_failed", reason: "Amount was short" } })
    );
  });

  it("fills the delivery form from a paid order and marks it delivered", async () => {
    const onUseForDelivery = jest.fn();
    render(<AdminOrders onUseForDelivery={onUseForDelivery} />);
    await screen.findByText("DX-V1");
    fireEvent.click(screen.getByRole("tab", { name: "To deliver" }));
    const card = await screen.findByRole("listitem", { name: "Order DX-P1" });

    fireEvent.click(within(card).getByRole("button", { name: /Fill delivery email/ }));
    expect(onUseForDelivery).toHaveBeenCalledWith({ email: "buyer@example.com", productName: "Test Product", planDuration: "12 Months × 2" });

    fireEvent.click(within(card).getByRole("button", { name: /Mark delivered/ }));
    expect(await screen.findByText("DX-P1: delivered.")).toBeInTheDocument();
  });

  it("shows the server's error when a change isn't allowed", async () => {
    authRequest.mockImplementation(async (path, options = {}) => {
      if (!options.method) return { orders: lists.verifying };
      throw Object.assign(new Error("This order is cancelled, so it can't be marked paid."), { status: 409 });
    });
    render(<AdminOrders onUseForDelivery={jest.fn()} />);
    const card = await screen.findByRole("listitem", { name: "Order DX-V1" });
    fireEvent.click(within(card).getByRole("button", { name: /Payment received/ }));
    expect(await screen.findByText("DX-V1: This order is cancelled, so it can't be marked paid.")).toBeInTheDocument();
  });
});
