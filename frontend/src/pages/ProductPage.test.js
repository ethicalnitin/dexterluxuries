import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import ProductPage from "./ProductPage";
import { useAuth } from "./AuthContext";
import { useCart } from "./CartContext";

jest.mock("./AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("./CartContext", () => ({ useCart: jest.fn() }));

const jsonResponse = (status, body) =>
  Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) });

const product = {
  id: 7,
  name: "Test Product",
  brand: "Brand",
  category: "Tools",
  description: '<p>Great <strong>tool</strong></p><script>window.hacked = 1</script><img src="x" onerror="window.hacked = 2">',
  plans: [
    { name: "3 Months", durationInMonths: 3, price: 5, strikeThroughPrice: 9 },
    { name: "12 Months", durationInMonths: 12, price: 15 },
    { name: "Lifetime", price: 30, available: false },
  ],
};

function CheckoutProbe() {
  const { state } = useLocation();
  return <pre data-testid="checkout-state">{JSON.stringify(state)}</pre>;
}

function renderProduct(path = "/product/7") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/checkout" element={<CheckoutProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeAll(() => {
  global.IntersectionObserver = class {
    observe() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView = () => {};
});

let addItem;
let requireAuth;

beforeEach(() => {
  requireAuth = jest.fn();
  useAuth.mockReturnValue({ user: null, requireAuth });
  addItem = jest.fn(() => ({ added: 1, quantity: 1, full: false }));
  useCart.mockReturnValue({ addItem });
  global.fetch = jest.fn().mockReturnValue(jsonResponse(200, product));
});

describe("ProductPage", () => {
  it("shows the product, its first in-stock plan and the rupee amount", async () => {
    renderProduct();
    expect(await screen.findByRole("heading", { name: "Test Product" })).toBeInTheDocument();
    expect(global.fetch.mock.calls[0][0]).toMatch(/\/products\/7$/);
    expect(screen.getByRole("radio", { name: /3 Months/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("button", { name: "Buy now — $5.00" })).toBeEnabled();
    expect(screen.getByText("₹495")).toBeInTheDocument();
  });

  it("renders the description without scripts or event handlers", async () => {
    renderProduct();
    await screen.findByRole("heading", { name: "Test Product" });
    /* eslint-disable testing-library/no-node-access */
    const description = document.querySelector(".pdp-description");
    expect(description).toHaveTextContent("Great tool");
    expect(description.querySelector("script")).toBeNull();
    expect(description.querySelector("[onerror]")).toBeNull();
    /* eslint-enable testing-library/no-node-access */
    expect(window.hacked).toBeUndefined();
  });

  it("shows the server's error message when the product doesn't exist", async () => {
    global.fetch.mockReturnValue(jsonResponse(404, { error: "Product not found." }));
    renderProduct("/product/999");
    expect(await screen.findByText("Product not found.")).toBeInTheDocument();
  });

  it("rejects a non-numeric id without calling the API", async () => {
    renderProduct("/product/abc");
    expect(await screen.findByText(/Invalid product ID/)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("can't select an out-of-stock plan", async () => {
    renderProduct();
    await screen.findByRole("heading", { name: "Test Product" });
    expect(screen.getByRole("radio", { name: /Lifetime/ })).toBeDisabled();
  });

  it("asks a guest to log in, then checks out just the chosen plan", async () => {
    renderProduct();
    await screen.findByRole("heading", { name: "Test Product" });
    fireEvent.click(screen.getByRole("radio", { name: /12 Months/ }));
    fireEvent.click(screen.getAllByRole("button", { name: /^Buy now/ })[0]);

    expect(requireAuth).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("checkout-state")).not.toBeInTheDocument();
    act(() => requireAuth.mock.calls[0][0]());
    const handoff = JSON.parse((await screen.findByTestId("checkout-state")).textContent);
    expect(handoff).toEqual({
      items: [{ productId: 7, planIndex: 1, planName: "12 Months", quantity: 1 }],
      source: "buy_now",
    });
    expect(addItem).not.toHaveBeenCalled();
  });

  it("adds the chosen plan to the cart and says so", async () => {
    renderProduct();
    await screen.findByRole("heading", { name: "Test Product" });
    fireEvent.click(screen.getByRole("radio", { name: /12 Months/ }));
    fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));

    expect(addItem).toHaveBeenCalledWith({
      productId: 7,
      planIndex: 1,
      planName: "12 Months",
      unitPrice: 15,
      name: "Test Product",
      image: "",
    });
    expect(screen.getByText(/Added 12 Months to your cart/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View cart" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: /3 Months/ }));
    expect(screen.queryByText(/Added 12 Months/)).not.toBeInTheDocument();
  });

  it("explains when the cart already holds the maximum of a plan", async () => {
    addItem.mockReturnValue({ added: 0, quantity: 5, full: false });
    renderProduct();
    await screen.findByRole("heading", { name: "Test Product" });
    fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(screen.getByText(/already have the maximum of 5/)).toBeInTheDocument();
  });

  it("treats a product marked out of stock as unavailable for every plan", async () => {
    global.fetch.mockReturnValue(jsonResponse(200, { ...product, stock: false }));
    renderProduct();
    await screen.findByRole("heading", { name: "Test Product" });
    expect(screen.getByText("This product is out of stock right now.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add to cart" })).toBeDisabled();
    expect(screen.getAllByRole("button", { name: "Out of stock" })[0]).toBeDisabled();
  });
});
