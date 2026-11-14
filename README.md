# Muthamilarignar Pathipagam — Storefront

Official bilingual (Tamil & English) Next.js storefront for **Muthamilarignar Pathipagam (முத்தமிழறிஞர் பதிப்பகம்)**, transitioning to Shopify Storefront API as the headless backend.

## Setup

1. Copy `.env.example` to `.env.local` and configure Shopify Storefront credentials:
   - `SHOPIFY_STORE_DOMAIN`
   - `SHOPIFY_STOREFRONT_TOKEN`
   - `SHOPIFY_REVALIDATION_SECRET`
   - `NEXT_PUBLIC_SITE_URL`
2. Install dependencies and start the development server:

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run start
```
