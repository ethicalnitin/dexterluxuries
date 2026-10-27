import { isValidEmail, maskEmail } from "./email";

describe("isValidEmail", () => {
  it.each(["a@b.co", "  jane.doe@example.com  ", "x+tag@sub.example.org"])("accepts %p", (value) => {
    expect(isValidEmail(value)).toBe(true);
  });
  it.each(["", "plain", "a@b", "a b@c.com", "@example.com", null, undefined])("rejects %p", (value) => {
    expect(isValidEmail(value)).toBe(false);
  });
});

describe("maskEmail", () => {
  it("keeps the first and last character of longer names (the feed's existing format)", () => {
    expect(maskEmail("jane.doe@gmail.com")).toBe("j***e@gmail.com");
  });
  it("keeps only the first character of short names", () => {
    expect(maskEmail("joe@gmail.com")).toBe("j***@gmail.com");
  });
  it("never reveals malformed or missing values", () => {
    expect(maskEmail("not-an-email")).toBe("***");
    expect(maskEmail("")).toBe("—");
    expect(maskEmail(undefined)).toBe("—");
  });
});
