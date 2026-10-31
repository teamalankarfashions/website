# Alankar Fashions — alankarfashions.com

Premium e-commerce for Alankar Fashions, Mangalwar Peth, Kolhapur.

## Stack
- **Next.js 15** (App Router) on **Cloudflare Workers** via OpenNext (`npm run cf-build`)
- **Supabase** (Mumbai): Postgres + Row Level Security, Auth (email OTP), Storage for product photos
- **Edge Function `api`** (`supabase/functions/api`): OTP login, server-side pricing & checkout, Razorpay order/verify/webhook, all emails
- **Razorpay + Cash on Delivery**, **Resend** for transactional email

## Where things live
- `app/(shop)` storefront · `app/admin` admin panel (`/admin`, email-OTP sign-in, roles: owner / manager / staff)
- `supabase/migrations` database schema, security policies and starter content
- `design/` original static design previews

## Security
- Only public keys are in this repo. Secrets: `RESEND_API_KEY` (Supabase function secret), Razorpay keys (owner enters in admin → private schema).
- Prices, stock, coupons and shipping are always recomputed on the server; Razorpay signatures are verified with HMAC.
- CSP, HSTS, frame-deny and other headers in `next.config.ts`.

## Deploy
Cloudflare Workers Builds from the `main` branch: build command `npm run cf-build`, deploy command `npx wrangler deploy`.
