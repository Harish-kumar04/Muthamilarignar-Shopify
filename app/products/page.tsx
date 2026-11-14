import type { Metadata } from "next";
import BooksCatalogClient from "@/components/product/books-catalog-client";
import {
  getCatalogSummarySafe,
  listCollections,
  listProducts,
  type ShopifyPageInfo,
} from "@/lib/shopify";
import { BRAND, LOGO_ALT, SITE_URL, getShareLogoUrl } from "@/lib/site-defaults";
import { buildListingJsonLd, PUBLISHER_ENTITY } from "@/lib/seo-schema";

export const revalidate = 120;

export async function generateMetadata(): Promise<Metadata> {
  const summary = await getCatalogSummarySafe();
  const books = summary.products;
  const shareLogo = getShareLogoUrl();
  const title = `நூல்கள் | Books — ${BRAND.nameTa} | ${BRAND.nameEn}`;
  const countCopy = books.length > 0 ? `${books.length} ` : "";
  const description = `Browse all ${countCopy}books published by ${BRAND.nameEn} (${BRAND.nameTa}) — Dravidian movement history, social justice and Kalaignar literature.`;
  const canonicalUrl = `${SITE_URL}/books`;
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    robots: { index: false, follow: true },
    openGraph: { title, description, url: canonicalUrl, type: "website", images: [{ url: shareLogo, alt: LOGO_ALT }] },
    twitter: { card: "summary_large_image", title, description, images: [{ url: shareLogo, alt: LOGO_ALT }] },
  };
}

export default async function ProductsPage() {
  let apiUnavailable = false;
  let rawProducts: any[] = [];
  let rawCategories: any[] = [];
  let pageInfo: ShopifyPageInfo = { hasNextPage: false, endCursor: null };

  try {
    const [prodRes, colRes] = await Promise.all([
      listProducts({ first: 24 }),
      listCollections({ first: 50 }),
    ]);
    rawProducts = prodRes.products;
    pageInfo = prodRes.pageInfo;
    rawCategories = colRes.collections;
  } catch {
    apiUnavailable = true;
  }

  const slim = rawProducts.map((p) => ({
    id: p.id,
    slug: p.slug ?? null,
    handle: p.handle ?? p.slug ?? null,
    name: p.name,
    sku: p.sku,
    author: p.author ?? null,
    category_id: p.category_id,
    category_slug: p.category_slug ?? null,
    collection_ids: p.collection_ids ?? [],
    collection_handles: p.collection_handles ?? [],
    description: p.description,
    priceRupees: p.priceRupees,
    compareAtPriceRupees: p.compareAtPriceRupees,
    price_cents: p.price_cents,
    sale_price_cents: p.sale_price_cents ?? null,
    availableForSale: p.availableForSale,
    quantityAvailable: p.quantityAvailable,
    inventory: p.inventory_quantity ?? p.inventory,
    inventory_quantity: p.inventory_quantity ?? p.inventory,
    image_url: p.image_url || p.images?.[0] || null,
    images: p.images ?? [],
    dimensions_json: p.dimensions_json,
  }));

  const cats = rawCategories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
  const canonicalUrl = `${SITE_URL}/books`;
  const jsonLd = buildListingJsonLd({
    url: canonicalUrl,
    listName: `அனைத்து நூல்கள் | All Books — ${PUBLISHER_ENTITY.nameEn}`,
    books: slim,
    breadcrumbs: [
      { name: `${PUBLISHER_ENTITY.nameTa} | Home`, url: SITE_URL },
      { name: "அனைத்து நூல்கள் | All Books", url: canonicalUrl },
    ],
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {apiUnavailable && (
        <div
          role="alert"
          className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-center text-xs font-medium text-amber-950"
        >
          சேவையகம் தற்காலிகமாகக் கிடைக்கவில்லை — Store is temporarily unavailable
        </div>
      )}
      <BooksCatalogClient
        products={slim}
        categories={cats}
        initialPageInfo={pageInfo}
        apiUnavailable={apiUnavailable}
      />
    </>
  );
}