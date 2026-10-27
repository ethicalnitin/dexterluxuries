# Storefront (React)

Setup, scripts, configuration and architecture are documented in the
[root README](../README.md#frontend-setup).

Quick start:

```bash
cp .env.example .env.local   # point REACT_APP_API_BASE at your local API
npm install
npm start
```

Where things live:

| Path | |
|---|---|
| `src/config/api.js` | API base URL and `apiRequest` (all HTTP goes through it) |
| `src/api/products.js` | Catalog requests (shared + cached list) |
| `src/pages/AuthContext.js` | Session, login/sign-up, `authRequest` |
| `src/components/RequireAuth.js` | Route guard (UI only — the API enforces access) |
| `src/components/ui/` | Shared UI kit, incl. `SafeHtml` for product descriptions |
| `src/theme/theme.js` | Brand, colours, fonts, store WhatsApp number |
