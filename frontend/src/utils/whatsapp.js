import theme from "../theme/theme";

export function whatsappUrl(message) {
  const number = theme.brand.whatsapp.replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
