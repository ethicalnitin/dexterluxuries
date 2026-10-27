import { getProducts, getProduct, clearProductCache } from "./products";

const jsonResponse = (status, body) =>
  Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) });

beforeEach(() => {
  clearProductCache();
  global.fetch = jest.fn();
});

describe("getProducts", () => {
  it("shares one request between simultaneous callers", async () => {
    global.fetch.mockReturnValue(jsonResponse(200, [{ id: 1 }]));
    const [a, b] = await Promise.all([getProducts(), getProducts()]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(a).toEqual([{ id: 1 }]);
    expect(b).toBe(a);
  });

  it("reuses the result for later callers", async () => {
    global.fetch.mockReturnValue(jsonResponse(200, [{ id: 1 }]));
    await getProducts();
    await getProducts();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("does not cache failures, so a retry makes a new request", async () => {
    global.fetch.mockReturnValueOnce(jsonResponse(500, { error: "Failed to fetch products" }));
    await expect(getProducts()).rejects.toThrow("Failed to fetch products");

    global.fetch.mockReturnValueOnce(jsonResponse(200, [{ id: 2 }]));
    await expect(getProducts()).resolves.toEqual([{ id: 2 }]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("treats a non-array response as an empty catalog", async () => {
    global.fetch.mockReturnValue(jsonResponse(200, { unexpected: true }));
    await expect(getProducts()).resolves.toEqual([]);
  });
});

describe("getProduct", () => {
  it("surfaces the server's { error } message", async () => {
    global.fetch.mockReturnValue(jsonResponse(404, { error: "Product not found." }));
    await expect(getProduct(9)).rejects.toMatchObject({ message: "Product not found.", status: 404 });
    expect(global.fetch.mock.calls[0][0]).toMatch(/\/products\/9$/);
  });
});
