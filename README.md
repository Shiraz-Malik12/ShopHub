# ShopHub

A single-seller online shop: customers browse, search, review and buy products; the owner manages
products, categories and orders from an admin area.

**Stack:** React 18 + Vite + Ant Design + Tailwind (frontend) · Node.js + Express + MongoDB/Mongoose (backend)

## Features

**Customers**
- Sign up with email verification (6-digit code), log in, forgot / reset password
- Browse the shop: search, filter by category, "in stock only", sort (newest, price, name, top rated), pages of 8
- Product pages with photos, stock status, star ratings and reviews
- Cart saved to the account (same cart on every device)
- Checkout with cash on delivery, order history, order tracking, cancel while pending
- Emails for order confirmation and every status change
- Profile: change name, change password (signs out other devices), saved delivery address
- Reviews: 1–5 stars + comment, only after the order containing the product was delivered

**Admin**
- Dashboard: total sales, orders by status, low stock, recent orders
- Orders: move Pending → Processing → Shipped → Delivered, or cancel (stock is returned)
- Products (with up to 5 images each) and categories; hide instead of delete
- Customers: search, orders and total spent per customer, saved address, order history
- Block / unblock a customer (signs them out everywhere; they can't log in or order)
- Remove inappropriate reviews

**Security**
- Short-lived access tokens + rotating refresh tokens in httpOnly cookies (stored as SHA-256 hashes)
- Passwords hashed with bcrypt; rate limits on login, OTP and password change
- Every input validated on the server; prices and totals always computed by the server
- Helmet security headers with a Content-Security-Policy
- The server refuses to start with missing or weak settings (`server/src/config/env.js`)

## Project structure

```
ShopHub/
├── src/                 React app (pages, components, api, context)
├── server/
│   └── src/
│       ├── routes/      URL → middleware → controller
│       ├── middleware/  protect (login), authorize (admin), uploads, rate limits
│       ├── validators/  request checks (express-validator)
│       ├── controllers/ the work: read/write the database, build responses
│       ├── models/      Mongoose schemas (User, Product, Category, Cart, Order, Review)
│       ├── utils/       email, tokens, image upload, helpers
│       ├── config/      database, Cloudinary, startup settings check
│       └── scripts/     seed:admin, seed:products
└── dist/                built website (created by `npm run build`)
```

## Requirements

- Node.js 20.11 or newer
- MongoDB (local, or a MongoDB Atlas connection string)
- For production: a Cloudinary account (image storage) and an SMTP account, e.g. Gmail with an App Password (emails)

## Run it locally

```bash
# 1. Install
npm install
npm --prefix server install

# 2. Configure the backend
cp server/.env.example server/.env
# then edit server/.env — at minimum MONGODB_URI and the two token secrets.
# Generate each secret with:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 3. Create the admin account (uses ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD from server/.env)
npm --prefix server run seed:admin

# 4. Optional: 12 demo products in 3 categories (REPLACES all existing products)
npm --prefix server run seed:products -- --yes

# 5. Start both (two terminals)
npm --prefix server run dev    # API on http://localhost:5000
npm run dev                    # website on http://localhost:5173
```

In development, Cloudinary and SMTP are optional: images are saved to `server/uploads/` and emails
(including sign-up codes) are printed in the server terminal instead of being sent.

## Run in production

The backend also serves the built website, so the whole shop runs as **one Node.js process on one address**.

1. Set these in `server/.env` (or in your host's environment settings):
   - `NODE_ENV=production`
   - `CLIENT_URL=https://your-shop-address`
   - `MONGODB_URI` (e.g. MongoDB Atlas)
   - `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET` — at least 32 characters each, different
   - `CLOUDINARY_*` and `SMTP_*` / `EMAIL_FROM`
   - `TRUST_PROXY=1` when running behind a hosting proxy (Render, Railway, Heroku, Nginx...)
2. Build and start:
   ```bash
   npm run start:prod
   ```
   (= `npm run build` then `npm --prefix server start`)

If a required setting is missing or too weak, the server stops at startup and lists exactly what to fix.

**Hosting example (Render "Web Service"):** build command
`npm install && npm --prefix server install && npm run build`, start command `npm --prefix server start`,
and add the environment variables above.

## Useful scripts

| Where | Command | What it does |
|---|---|---|
| root | `npm run dev` | Website with hot reload |
| root | `npm run build` | Build the website into `dist/` |
| root | `npm run lint` | Check frontend and backend code style |
| root | `npm run start:prod` | Build, then start the production server |
| server | `npm run dev` | API with auto-restart |
| server | `npm start` | API (production) |
| server | `npm run seed:admin` | Create or promote the admin account |
| server | `npm run seed:products -- --yes` | Replace the catalog with 12 demo products |
