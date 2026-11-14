# Muthamilarignar Pathipagam — Storefront

Official bilingual (Tamil & English) Next.js storefront for **Muthamilarignar Pathipagam (முத்தமிழறிஞர் பதிப்பகம்)** backed by the Shopify Storefront GraphQL API.

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

| Variable | Required | Description |
| --- | --- | --- |
| `SHOPIFY_STORE_DOMAIN` | Yes | Your Shopify shop domain (e.g. `your-store.myshopify.com`). |
| `SHOPIFY_STOREFRONT_TOKEN` | Yes | Public/Headless Storefront API access token (`X-Shopify-Storefront-Access-Token`). |
| `SHOPIFY_REVALIDATION_SECRET` | Yes | Webhook signing secret from **Settings → Notifications → Webhooks** used to verify `X-Shopify-Hmac-Sha256`. |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical public URL of the storefront (e.g. `https://muthamilarignarpathipagam.com`). |
| `SHOPIFY_VENDOR_FILTER` | Optional | **TEMPORARY** vendor filter. Set to `"Muthamilarignar Pathipagam"` while sharing a multi-vendor Shopify store; leave empty (`SHOPIFY_VENDOR_FILTER=`) to disable vendor filtering. |
| `FREE_SHIPPING_THRESHOLD` | Optional | Free-shipping progress bar threshold in INR (`500` by default). |

### Required Storefront API Access & Metafields

1. Enable Storefront API scopes on the Headless / Custom Storefront app:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_product_inventory` (for `quantityAvailable`)
   - `unauthenticated_read_checkouts` / `unauthenticated_write_checkouts` (Cart & Checkout API)
2. Expose the following **Product Metafields** (`Settings → Custom data → Products`) with **Storefront access** enabled:
   - `custom.author`
   - `custom.publisher`
   - `custom.language`
   - `custom.pages`
   - `custom.binding`
   - `custom.isbn`
   - `custom.year`
3. Product & collection titles use bilingual format `தமிழ் தலைப்பு | English Title` (split on `" | "`).

## Shopify Webhook Setup (On-Demand ISR Revalidation)

Catalog pages use ISR (`revalidate = 120`) combined with cache tags (`products`, `collections`, `product:<handle>`, `collection:<handle>`). Configure Shopify webhooks so catalog updates invalidate cached pages immediately:

1. In Shopify Admin, open **Settings → Notifications → Webhooks**.
2. Click **Create webhook** and add the following four webhooks pointing to `https://<your-domain>/api/revalidate` with **Format: JSON** and the latest stable **Webhook API version**:
   - **Product creation** (`products/create`) → `https://<your-domain>/api/revalidate`
   - **Product update** (`products/update`) → `https://<your-domain>/api/revalidate`
   - **Product deletion** (`products/delete`) → `https://<your-domain>/api/revalidate`
   - **Collection update** (`collections/update`) → `https://<your-domain>/api/revalidate`
3. At the bottom of the **Webhooks** section, copy the signing key shown under *"All your webhooks will be signed with..."* and set it as `SHOPIFY_REVALIDATION_SECRET` in `.env.local` and your hosting environment (e.g. Vercel).
4. `POST /api/revalidate` reads the raw request body, computes `base64(HMAC-SHA256(rawBody, SHOPIFY_REVALIDATION_SECRET))`, verifies it against `X-Shopify-Hmac-Sha256` using constant-time comparison, and revalidates the affected product/collection cache tags and sitemap.

## Local Development, Cart Verification & Production Build

```bash
npm install
npm run dev
```

Verify live Shopify Cart API (`cartCreate -> cartLinesAdd -> cartLinesUpdate -> cartLinesRemove`) against `.env.local`:

```bash
npm run verify:cart
```

```bash
npm run build
npm run type-check
npm run start
```
