import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import OrderHistoryPage from "./OrderHistoryPage";
import { useAuth } from "./AuthContext";

jest.mock("./AuthContext", () => ({ useAuth: jest.fn() }));

const order = (id, overrides = {}) => ({
  id,
  orderRef: `DX-${id.toUpperCase()}`,
  status: "fulfilled",
  items: [{ productId: 7, productName: "Test Product", planName: "1 Month", quantity: 1, lineTotalInr: 891 }],
  itemCount: 1,
  totalInr: 891,
  createdAt: "2026-10-20T10:00:00.000Z",
  ...overrides,
});

let authRequest;
function renderHistory() {
  return render(
    <MemoryRouter>
      <OrderHistoryPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  authRequest = jest.fn();
  useAuth.mockReturnValue({ authRequest });
});

describe("OrderHistoryPage", () => {
  it("lists the customer's orders with status and total", async () => {
    authRequest.mockResolvedValue({
      orders: [
        order("aaa111", { status: "pending_payment", items: [order("x").items[0], { productId: 8, productName: "Other", planName: "Lifetime", quantity: 1 }], itemCount: 2, totalInr: 2376 }),
        order("bbb222"),
      ],
      nextCursor: null,
    });
    renderHistory();
    expect(await screen.findByRole("link", { name: "DX-AAA111" })).toHaveAttribute("href", "/orders/aaa111");
    expect(screen.getByText("Test Product + 1 more")).toBeInTheDocument();
    expect(screen.getByText("Awaiting payment")).toBeInTheDocument();
    expect(screen.getByText("₹2,376")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pay now" })).toHaveAttribute("href", "/orders/aaa111");
    expect(screen.getByText("Delivered")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View order DX-BBB222" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Load more/ })).not.toBeInTheDocument();
  });

  it("has an empty state", async () => {
    authRequest.mockResolvedValue({ orders: [], nextCursor: null });
    renderHistory();
    expect(await screen.findByText("No orders yet")).toBeInTheDocument();
  });

  it("offers a retry when orders can't be loaded", async () => {
    authRequest.mockRejectedValueOnce(new Error("Couldn't load your orders. Try again.")).mockResolvedValue({ orders: [order("ccc333")], nextCursor: null });
    renderHistory();
    expect(await screen.findByText("Couldn't load your orders. Try again.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("link", { name: "DX-CCC333" })).toBeInTheDocument();
  });

  it("loads older orders on request", async () => {
    authRequest
      .mockResolvedValueOnce({ orders: [order("new111")], nextCursor: "new111" })
      .mockResolvedValueOnce({ orders: [order("old222")], nextCursor: null });
    renderHistory();
    fireEvent.click(await screen.findByRole("button", { name: "Load more orders" }));
    expect(await screen.findByRole("link", { name: "DX-OLD222" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "DX-NEW111" })).toBeInTheDocument();
    expect(authRequest).toHaveBeenLastCalledWith("/orders?before=new111", expect.anything());
    expect(screen.queryByRole("button", { name: "Load more orders" })).not.toBeInTheDocument();
  });
});
