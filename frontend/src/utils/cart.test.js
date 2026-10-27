import {
  MAX_CART_LINES,
  MAX_ITEM_QUANTITY,
  addLine,
  cartCount,
  lineKey,
  mergeCarts,
  readStoredCart,
  removeLine,
  sanitizeItems,
  setLineQuantity,
  writeStoredCart,
} from "./cart";

const monthly = { productId: 7, planIndex: 0, planName: "1 Month", unitPrice: 5, name: "Tool" };
const yearly = { productId: 7, planIndex: 1, planName: "12 Months", unitPrice: 40, name: "Tool" };

describe("cart helpers", () => {
  it("adds a new line, then merges further adds of the same plan", () => {
    let result = addLine([], monthly);
    expect(result).toMatchObject({ added: 1, quantity: 1, full: false });
    result = addLine(result.items, monthly, 2);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].quantity).toBe(3);
    result = addLine(result.items, yearly);
    expect(result.items).toHaveLength(2);
    expect(cartCount(result.items)).toBe(4);
  });

  it("caps the quantity per line and the number of lines", () => {
    let { items } = addLine([], monthly, MAX_ITEM_QUANTITY);
    const atCap = addLine(items, monthly);
    expect(atCap).toMatchObject({ added: 0, quantity: MAX_ITEM_QUANTITY });

    items = Array.from({ length: MAX_CART_LINES }, (_, i) => ({ ...monthly, productId: i + 1, quantity: 1 }));
    expect(addLine(items, { ...monthly, productId: 999 })).toMatchObject({ added: 0, full: true });
  });

  it("sets quantities within 1..max and removes lines", () => {
    const items = addLine([], monthly).items;
    const key = lineKey(monthly);
    expect(setLineQuantity(items, key, 0)[0].quantity).toBe(1);
    expect(setLineQuantity(items, key, 99)[0].quantity).toBe(MAX_ITEM_QUANTITY);
    expect(removeLine(items, key)).toEqual([]);
  });

  it("merges a guest cart into an account cart without doubling shared lines", () => {
    const account = [{ ...monthly, quantity: 2 }];
    const guest = [{ ...monthly, quantity: 1 }, { ...yearly, quantity: 1 }];
    const merged = mergeCarts(account, guest);
    expect(merged.map((i) => [lineKey(i), i.quantity])).toEqual([
      [lineKey(monthly), 2],
      [lineKey(yearly), 1],
    ]);
  });

  it("drops malformed stored lines and de-duplicates", () => {
    const clean = sanitizeItems([
      { productId: 7, planIndex: 0, quantity: 2 },
      { productId: 7, planIndex: 0, quantity: 3 },
      { productId: "x", planIndex: 0 },
      { productId: 8 },
      { productId: 9, planName: "Lifetime", quantity: 50 },
      null,
    ]);
    expect(clean).toEqual([
      { productId: 7, planIndex: 0, quantity: 3 },
      { productId: 9, planName: "Lifetime", quantity: MAX_ITEM_QUANTITY },
    ]);
  });

  it("round-trips through localStorage and survives corrupted data", () => {
    writeStoredCart({ owner: "u1", items: [{ ...monthly, quantity: 2 }], dirty: true });
    expect(readStoredCart()).toEqual({ owner: "u1", items: [{ ...monthly, quantity: 2 }], dirty: true });
    localStorage.setItem("mkr_cart_v1", "{not json");
    expect(readStoredCart()).toEqual({ owner: null, items: [], dirty: false });
  });
});
