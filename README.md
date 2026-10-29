

A digital-product store: a React storefront, an Express + MongoDB API, manual
UPI payment verification, and an admin page for delivering access by email.

```
React SPA (frontend/)  ──HTTPS/JSON──▶  Express API (backend/)  ──▶  MongoDB
  hash routes, CRA                       JWT auth, roles, rate limits       products, users, carts,
                                         SMTP email · Telegram alerts      reset codes, UTRs
Firebase Firestore ◀── public "recent orders" feed (written by the admin page)
```

**How a purchase works:** the shopper picks a plan and either buys it straight
away ("Buy now") or adds it to the cart and checks out several products at once
→ enters an email → the payment page asks the server for the price of every
line (`POST /api/cart/quote`) and shows that total → the shopper pays it by UPI
and submits the 12-digit UTR (`POST /api/orders/confirm`; the server records
the lines, re-checks the amount against the catalog and alerts Telegram) → an
admin verifies the payment in the bank app and sends access from
`/#/filedelivery` (`POST /api/admin/deliveries`).

**Cart:** guests' carts are kept in the browser (localStorage); signed-in
customers' carts are saved to their account (`GET`/`PUT /api/cart`), merged
with any guest cart at login and removed from the browser at logout. Up to 20
products per cart and 5 of each plan (`backend/config/pricing.js` and
`frontend/src/utils/cart.js` — keep them in step).

## Repository layout

| Path | What's there |
|---|---|
| `backend/index.js` | Entry point (`npm start`): loads `.env`, validates config, handles signals |
| `backend/server.js` | Starts/stops the HTTP server and MongoDB connection |
| `backend/app.js` | Express app: middleware and route wiring |
| `backend/config/` | `env.js` (all configuration + validation), pricing, delivery presets |
| `backend/routes/` | `auth`, `products`, `orders`, `admin`, `health` |
| `backend/middleware/` | auth/roles, rate limiting, security headers, request ids, errors |
| `backend/tests/` | Integration and unit tests (`node --test`) |
| `backend/scripts/set-role.js` | Grant or remove the admin role |
| `frontend/src/` | React app: `pages/`, `components/`, `api/`, `config/api.js`, `utils/` |

## Requirements

- **Node.js 22 or newer** (`backend/package.json` → `engines`). Node 18 and 20
  are end-of-life. CI runs Node 22; the suites were also run locally on 24.
- **MongoDB** 7 (the version the tests and CI use). The backend tests start a throwaway
  `mongod` themselves, so it must be on your `PATH` (or set `MONGOD_PATH`), or
  point `TEST_MONGO_URL` at a server you don't mind tests writing to.
- npm (comes with Node).

## Backend setup

```bash
cd backend
cp .env.example .env      # then fill in MONGO_URL, JWT_SECRET, OTP_SECRET
npm install
npm run dev               # nodemon; http://localhost:3046
```

Use a **development database** in `MONGO_URL`, never the production one.
The server refuses to start if required settings are missing or invalid, and
prints a warning for risky ones; every variable is documented in
[`backend/.env.example`](backend/.env.example).

| Command | Does |
|---|---|
| `npm start` | Run the server (production) |
| `npm run dev` | Run with auto-restart |
| `npm test` | All backend tests (each file gets its own throwaway database) |
| `npm run lint` | ESLint |
| `npm run set-role -- you@example.com admin` | Make an existing account an admin (`customer` to undo) |

### Admin access

Admins can add products and use the fulfillment page. Sign up on the site
first, then run `npm run set-role -- you@example.com admin` from `backend/`.
It uses the `MONGO_URL` in `backend/.env` and prints which database it
connected to — check that before trusting the result. The role is read from
the database on every request, so promoting/demoting takes effect immediately.

### Adding a product

```bash
# 1. Log in as an admin to get a token
curl -s -X POST http://localhost:3046/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"..."}'

# 2. Add the product (id must be a new positive whole number; prices in USD)
curl -s -X POST http://localhost:3046/api/products/add \
  -H 'Content-Type: application/json' -H 'Authorization: Bearer <token>' \
  -d '{"id":12,"name":"Example","brand":"Brand","category":"Tools",
       "description":"<p>What is included</p>","downloadLink":"https://…",
       "plans":[{"name":"3 Months","durationInMonths":3,"price":5,"strikeThroughPrice":9}]}'
```

`downloadLink` is stored but never returned by the public API.

## Frontend setup

```bash
cd frontend
cp .env.example .env.local   # REACT_APP_API_BASE=http://localhost:3046/api
npm install
npm start                    # http://localhost:3000
```

Without `REACT_APP_API_BASE` the app talks to the production API.

| Command | Does |
|---|---|
| `npm start` | Dev server |
| `npm test` | Jest + Testing Library (add `-- --watchAll=false` for a single run) |
| `npm run lint` | ESLint (Create React App rules, zero warnings allowed) |
| `npm run build` | Production build in `build/` |

The app uses hash routes (`/#/product/1`), so a static host needs no rewrite
rules.

## API

All endpoints return JSON. **Every error has the shape `{ "error": "message" }`**;
unexpected server errors (500) also include `requestId`. Every response has an
`X-Request-Id` header — quote it when reporting a problem; it matches the logs.

| Method & path | Access | Notes |
|---|---|---|
| `GET /health` | public | Liveness: process is up |
| `GET /health/ready` | public | Readiness: 503 if MongoDB is down or the server is shutting down |
| `GET /api/products` · `GET /api/products/:id` | public | Catalog (no `downloadLink`) |
| `POST /api/products/add` | admin | Validated, field allow-list, unique `id` |
| `POST /api/auth/signup` · `/login` | public | Returns `{ token, user }` |
| `POST /api/auth/forgot-password` · `/reset-password` | public | 6-digit emailed code |
| `GET /api/auth/me` | signed in | Current profile (incl. `role`) |
| `POST /api/cart/quote` | public | Prices cart lines from the catalog: per-line status (`ok` · `unavailable` · `not_found`), USD subtotal, rupee total |
| `GET /api/cart` · `PUT /api/cart` | signed in | The customer's saved cart (`PUT` replaces it) |
| `POST /api/orders/confirm` | public | Records a UTR with `items` (cart/checkout) or one product (older checkout); amount re-checked against the catalog |
| `GET /api/admin/delivery-presets` · `POST /api/admin/deliveries` | admin | Fulfillment |

## Security model

- **Authentication:** email + password (scrypt hashes). Login returns a JWT
  (HS256, 30 days) sent as `Authorization: Bearer …`; changing the password
  invalidates older tokens. Reset codes are hashed (HMAC with `OTP_SECRET`),
  expire after 5 minutes and allow 5 guesses.
- **Authorization:** `customer` / `admin` roles, enforced on the server for
  every admin route. The React route guard only decides what to render.
- **Rate limits (per client IP):** whole API 300/min · sign-up 10/hour ·
  login 10 per 15 min per IP+email · forgot-password 10 per 15 min plus a
  30 s cooldown per email · reset-password 20 per 15 min · order
  confirmation 8 per 10 min. 429 responses include `Retry-After`.
- **Headers:** `nosniff`, `X-Frame-Options: DENY`, a strict referrer policy,
  HSTS over HTTPS, a no-render CSP and `Cache-Control: no-store` on
  auth/admin/order responses.
- **CORS:** restricted to `ALLOWED_ORIGINS` when set.
- **Logging:** JSON lines in production; passwords, tokens and similar keys
  are redacted, customer emails are masked, and request logs carry no IPs,
  bodies or query strings.
- **Product descriptions** are rendered through an allow-list sanitizer
  (`frontend/src/components/ui/SafeHtml.js`), never as raw HTML.

## Deployment

The API runs on Railway (`https://dexterluxuries-production.up.railway.app`).
Settings to check in the hosting dashboard:

| Setting | Value |
|---|---|
| Root directory | `backend` |
| Start command | `npm start` |
| Node version | 22+ (taken from `engines`; confirm in the build log) |
| Health check path | `/health/ready` |
| Replicas | **1** — rate limits and the product cache are in memory |
| Environment | `NODE_ENV=production`, `MONGO_URL`, `JWT_SECRET` (32+ chars), `OTP_SECRET`, `ALLOWED_ORIGINS`, `SMTP_*`, `TELEGRAM_*` |

`trust proxy` is set to one hop (correct behind Railway's proxy). If you put
another proxy/CDN in front, update it in `backend/app.js`, or clients can spoof
their IP past the rate limits.

On `SIGTERM` the server reports not-ready, stops accepting connections, lets
in-flight requests finish, closes MongoDB and exits (forced after 10 s).
Crashes (uncaught exceptions/rejections) are logged and exit non-zero so the
host restarts the process.

The frontend is a static build: set `REACT_APP_API_BASE` at build time if the
API isn't the default production URL.

CI (`.github/workflows/ci.yml`) lints, tests and builds both apps on every
push to `main` and every pull request.

## Known limitations

- `backend/.env` is still tracked in git and contains live credentials: rotate
  them, move them into the host's environment settings, then untrack the file.
- The public "recent orders" feed is written to Firestore from the browser, so
  its security rules must allow public writes.
- Sign-up doesn't verify email ownership.
- The JWT lives in `localStorage` (readable by any script that runs on the page).
- Order references are generated in the browser; refreshing the payment page
  loses the order (the buyer can still finish over WhatsApp).
- Rate limits are per process and reset on restart.
- Create React App is unmaintained; its build tooling carries known advisories
  (build time only, not shipped to browsers).
