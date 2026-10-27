export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

export function maskEmail(email) {
  if (!email) return "—";
  const [user, domain] = String(email).split("@");
  if (!user || !domain) return "***";
  return `${user[0]}***${user.length > 3 ? user[user.length - 1] : ""}@${domain}`;
}
