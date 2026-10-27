import { whatsappUrl } from "./whatsapp";
import theme from "../theme/theme";

it("builds a wa.me link with a digits-only number and an encoded message", () => {
  const digits = theme.brand.whatsapp.replace(/\D/g, "");
  expect(whatsappUrl("Hi & thanks?\nOrder: DX-1")).toBe(`https://wa.me/${digits}?text=Hi%20%26%20thanks%3F%0AOrder%3A%20DX-1`);
  expect(digits).toMatch(/^\d{8,15}$/);
});
