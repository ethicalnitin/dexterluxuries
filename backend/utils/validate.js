const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const readString = (value) => (typeof value === "string" ? value : "");

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

module.exports = { isValidEmail, normalizeEmail, readString, isHttpsUrl };
