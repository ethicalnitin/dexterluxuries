// Backend base URL for the product API, shared by HomePage and ProductPage.
// Set REACT_APP_API_BASE (e.g. http://localhost:3046/api in .env.local) to
// point the store at another backend; otherwise production is used.
export const API_BASE = process.env.REACT_APP_API_BASE || "https://dexterluxuries-production.up.railway.app/api";
