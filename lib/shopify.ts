import { cache } from "react";
import { splitBilingual } from "@/lib/i18n";
import { isVariantInStock, normalizeQuantityAvailable } from "@/lib/stock";

/** Latest stable Shopify Storefront GraphQL API version. */
export const SHOPIFY_STOREFRONT_API_VERSION = "2026-01";

/** Default ISR window (seconds) paired with tag-based revalidation. */
export const SHOPIFY_REVALIDATE_SECONDS = 120;

/** Hard network timeout (ms) for Storefront GraphQL requests. */
const SHOPIFY_TIMEOUT_MS = 8_000;

export class ShopifyConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShopifyConfigError";
  }
}

export interface ShopifyGraphQLError {
  message: string;
  locations?: { line: number; column: number }[];
  path?: (string | number)[];
  extensions?: Record<string, unknown>;
}

export class ShopifyApiError extends Error {
  status?: number;
  graphqlErrors?: ShopifyGraphQLError[];

  constructor(
    message: string,
    opts?: { status?: number; graphqlErrors?: ShopifyGraphQLError[] },
  ) {
    super(message);
    this.name = "ShopifyApiError";
    this.status = opts?.status;
    this.graphqlErrors = opts?.graphqlErrors;
  }
}

function normalizeDomain(raw?: string): string {
  if (!raw) return "";
  return raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
}

export function getShopifyConfig(): { domain: string; token: string } {
  const domain = normalizeDomain(process.env.SHOPIFY_STORE_DOMAIN);
  const token = (process.env.SHOPIFY_STOREFRONT_TOKEN ?? "").trim();
  if (!domain || !token) {
    const missing = [
      !domain ? "SHOPIFY_STORE_DOMAIN" : null,
      !token ? "SHOPIFY_STOREFRONT_TOKEN" : null,
    ]
      .filter(Boolean)
      .join(", ");
    throw new ShopifyConfigError(
      `Missing required Shopify Storefront environment variable(s): ${missing}`,
    );
  }
  return { domain, token };
}

export function isShopifyConfigured(): boolean {
  return Boolean(
    normalizeDomain(process.env.SHOPIFY_STORE_DOMAIN) &&
      (process.env.SHOPIFY_STOREFRONT_TOKEN ?? "").trim(),
  );
}

/**
 * TEMPORARY vendor isolation filter.
 * When `SHOPIFY_VENDOR_FILTER` is non-empty (e.g. "Muthamilarignar Pathipagam"),
 * all product queries restrict results to that vendor. Empty = no filter.
 */
export function getVendorFilter(): string {
  return (process.env.SHOPIFY_VENDOR_FILTER ?? "").trim();
}

function matchesVendorFilter(vendor?: string | null): boolean {
  const filter = getVendorFilter();
  if (!filter) return true;
  return (vendor ?? "").trim().toLowerCase() === filter.toLowerCase();
}

function buildShopifySearchQuery(opts: {
  search?: string;
  availableOnly?: boolean;
}): string | undefined {
  const parts: string[] = [];
  const vendor = getVendorFilter();
  if (vendor) {
    parts.push(`vendor:${JSON.stringify(vendor)}`);
  }
  if (opts.availableOnly) {
    parts.push("available_for_sale:true");
  }
  const q = (opts.search ?? "").trim();
  if (q) {
    const sanitized = q.replace(/["\\]/g, " ").trim();
    if (sanitized) {
      parts.push(`(${sanitized})`);
    }
  }
  return parts.length > 0 ? parts.join(" AND ") : undefined;
}

export interface ShopifyFetchOptions<TVars = Record<string, unknown>> {
  query: string;
  variables?: TVars;
  tags?: string[];
  revalidate?: number;
}

export async function shopifyFetch<
  TData,
  TVars extends Record<string, unknown> = Record<string, unknown>,
>({
  query,
  variables,
  tags = [],
  revalidate = SHOPIFY_REVALIDATE_SECONDS,
}: ShopifyFetchOptions<TVars>): Promise<TData> {
  const { domain, token } = getShopifyConfig();
  const endpoint = `https://${domain}/api/${SHOPIFY_STOREFRONT_API_VERSION}/graphql.json`;

  const execute = async (gqlQuery: string): Promise<TData> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SHOPIFY_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Shopify-Storefront-Access-Token": token,
        },
        body: JSON.stringify({ query: gqlQuery, variables }),
        signal: controller.signal,
        next: {
          revalidate,
          tags,
        },
      });
    } catch (err: any) {
      if (err?.name === "AbortError") {
        throw new ShopifyApiError(
          `Shopify Storefront API request timed out after ${SHOPIFY_TIMEOUT_MS}ms`,
        );
      }
      throw new ShopifyApiError(
        `Shopify Storefront API network error: ${err?.message || "fetch failed"}`,
      );
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const bodyPreview = await res.text().catch(() => "");
      throw new ShopifyApiError(
        `Shopify Storefront API HTTP ${res.status} ${res.statusText}${bodyPreview ? `: ${bodyPreview.slice(0, 200)}` : ""}`,
        { status: res.status },
      );
    }

    const json = (await res.json()) as {
      data?: TData;
      errors?: ShopifyGraphQLError[];
    };

    if (Array.isArray(json.errors) && json.errors.length > 0) {
      throw new ShopifyApiError(
        `Shopify Storefront GraphQL error: ${json.errors.map((e) => e.message).join("; ")}`,
        { graphqlErrors: json.errors },
      );
    }

    if (!json.data) {
      throw new ShopifyApiError("Shopify Storefront API returned an empty data payload");
    }

    return json.data;
  };

  try {
    return await execute(query);
  } catch (err) {
    // Graceful scope fallback if `unauthenticated_read_product_inventory` is not enabled yet on the token
    if (
      err instanceof ShopifyApiError &&
      err.graphqlErrors?.some((e) => /quantityAvailable/i.test(e.message)) &&
      query.includes("quantityAvailable")
    ) {
      return execute(query.replace(/\bquantityAvailable\b/g, ""));
    }
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/* GraphQL Types & Fragments                                           */
/* ------------------------------------------------------------------ */

export interface ShopifyPageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

interface RawMoney {
  amount: string;
  currencyCode: string;
}

interface RawImage {
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
}

interface RawMetafield {
  namespace: string;
  key: string;
  value: string;
}

interface RawVariantNode {
  id: string;
  title: string;
  sku?: string | null;
  availableForSale: boolean;
  quantityAvailable?: number | null;
  price: RawMoney;
  compareAtPrice?: RawMoney | null;
}

interface RawProductNode {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  description: string;
  descriptionHtml: string;
  availableForSale: boolean;
  updatedAt: string;
  seo?: {
    title?: string | null;
    description?: string | null;
  } | null;
  priceRange: {
    minVariantPrice: RawMoney;
  };
  compareAtPriceRange: {
    minVariantPrice: RawMoney;
  };
  featuredImage?: RawImage | null;
  images: {
    nodes: RawImage[];
  };
  collections?: {
    nodes: {
      id: string;
      handle: string;
      title: string;
    }[];
  };
  variants: {
    nodes: RawVariantNode[];
  };
  metafields: (RawMetafield | null)[];
}

interface RawCollectionNode {
  id: string;
  handle: string;
  title: string;
  description: string;
  updatedAt: string;
  image?: RawImage | null;
}

export interface ShopifyVariant {
  id: string;
  title: string;
  sku: string | null;
  is_available: boolean;
  availableForSale: boolean;
  quantityAvailable: number | null;
  inventory_quantity: number | null;
  price_cents: number;
  sale_price_cents: number | null;
  priceRupees: number;
  compareAtPriceRupees: number | null;
}

export interface ShopifyBook {
  id: string;
  variant_id: string | null;
  slug: string;
  handle: string;
  name: string;
  titleTa: string;
  titleEn: string;
  vendor: string;
  sku: string;
  category_id: string;
  category_slug: string | null;
  collection_ids: string[];
  collection_handles: string[];
  description: string;
  description_html: string;
  priceRupees: number;
  compareAtPriceRupees: number | null;
  currencyCode: string;
  /** Original / MRP price in paise (cents) for UI strike-through & % OFF calculation. */
  price_cents: number;
  /** Active discounted selling price in paise when on sale, else null. */
  sale_price_cents: number | null;
  availableForSale: boolean;
  quantityAvailable: number | null;
  inventory: number | null;
  inventory_quantity: number | null;
  image_url: string | null;
  images: string[];
  author: string | null;
  publisher: string | null;
  language: string | null;
  pages: number | string | null;
  binding: string | null;
  isbn: string | null;
  year: string | null;
  dimensions_json: {
    book: {
      author: string | null;
      publisher: string | null;
      language: string | null;
      pages: number | string | null;
      binding: string | null;
      isbn: string | null;
      year: string | null;
    };
  };
  meta_title: string | null;
  meta_description: string | null;
  updated_at: string;
  variants: ShopifyVariant[];
}

export interface ShopifyCollection {
  id: string;
  slug: string;
  handle: string;
  name: string;
  titleTa: string;
  titleEn: string;
  description: string;
  image_url: string | null;
  updated_at: string;
}

const PRODUCT_FIELDS_FRAGMENT = /* GraphQL */ `
  fragment ProductFields on Product {
    id
    handle
    title
    vendor
    description
    descriptionHtml
    availableForSale
    updatedAt
    seo {
      title
      description
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      url
      altText
      width
      height
    }
    images(first: 10) {
      nodes {
        url
        altText
        width
        height
      }
    }
    collections(first: 10) {
      nodes {
        id
        handle
        title
      }
    }
    variants(first: 20) {
      nodes {
        id
        title
        sku
        availableForSale
        quantityAvailable
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
      }
    }
    metafields(
      identifiers: [
        { namespace: "custom", key: "author" }
        { namespace: "custom", key: "publisher" }
        { namespace: "custom", key: "language" }
        { namespace: "custom", key: "pages" }
        { namespace: "custom", key: "binding" }
        { namespace: "custom", key: "isbn" }
        { namespace: "custom", key: "year" }
      ]
    ) {
      namespace
      key
      value
    }
  }
`;

function mapMoneyPair(
  priceMoney?: RawMoney | null,
  compareAtMoney?: RawMoney | null,
): {
  priceRupees: number;
  compareAtPriceRupees: number | null;
  price_cents: number;
  sale_price_cents: number | null;
  currencyCode: string;
} {
  const selling = Number.parseFloat(priceMoney?.amount || "0") || 0;
  const compare = compareAtMoney?.amount ? Number.parseFloat(compareAtMoney.amount) || 0 : 0;
  const onSale = compare > selling && selling > 0;
  return {
    priceRupees: selling,
    compareAtPriceRupees: onSale ? compare : null,
    price_cents: Math.round((onSale ? compare : selling) * 100),
    sale_price_cents: onSale ? Math.round(selling * 100) : null,
    currencyCode: priceMoney?.currencyCode || "INR",
  };
}

export function mapShopifyProduct(node: RawProductNode): ShopifyBook {
  const [titleTa, titleEn] = splitBilingual(node.title, "|");
  const firstVariant =
    node.variants?.nodes?.find((v) =>
      isVariantInStock(v.availableForSale, v.quantityAvailable),
    ) ||
    node.variants?.nodes?.[0] ||
    null;

  const pricing = mapMoneyPair(
    firstVariant?.price ?? node.priceRange?.minVariantPrice,
    firstVariant?.compareAtPrice ?? node.compareAtPriceRange?.minVariantPrice,
  );

  const rawQty = normalizeQuantityAvailable(firstVariant?.quantityAvailable);
  const rawAvailableForSale =
    node.availableForSale === false
      ? false
      : firstVariant
        ? firstVariant.availableForSale !== false
        : true;
  const availableForSale = isVariantInStock(rawAvailableForSale, rawQty);

  const imageUrls = Array.from(
    new Set(
      [
        node.featuredImage?.url,
        ...(node.images?.nodes?.map((img) => img.url) || []),
      ].filter((u): u is string => Boolean(u && u.trim())),
    ),
  );

  const metaMap: Record<string, string> = {};
  for (const mf of node.metafields || []) {
    if (mf && mf.key && typeof mf.value === "string" && mf.value.trim()) {
      metaMap[mf.key] = mf.value.trim();
    }
  }

  const parsedPages = metaMap.pages
    ? Number.isFinite(Number(metaMap.pages))
      ? Number(metaMap.pages)
      : metaMap.pages
    : null;

  const bookMeta = {
    author: metaMap.author || null,
    publisher: metaMap.publisher || null,
    language: metaMap.language || null,
    pages: parsedPages,
    binding: metaMap.binding || null,
    isbn: metaMap.isbn || null,
    year: metaMap.year || null,
  };

  const collections = node.collections?.nodes || [];
  const primaryCollection = collections[0] || null;

  const variants: ShopifyVariant[] = (node.variants?.nodes || []).map((v) => {
    const vp = mapMoneyPair(v.price, v.compareAtPrice);
    const vQty = normalizeQuantityAvailable(v.quantityAvailable);
    const vAvailable = isVariantInStock(v.availableForSale, vQty);
    return {
      id: v.id,
      title: v.title,
      sku: v.sku || null,
      is_available: vAvailable,
      availableForSale: vAvailable,
      quantityAvailable: vQty,
      inventory_quantity: vQty,
      price_cents: vp.price_cents,
      sale_price_cents: vp.sale_price_cents,
      priceRupees: vp.priceRupees,
      compareAtPriceRupees: vp.compareAtPriceRupees,
    };
  });

  return {
    id: node.id,
    variant_id: firstVariant?.id ?? null,
    slug: node.handle,
    handle: node.handle,
    name: node.title,
    titleTa,
    titleEn,
    vendor: node.vendor,
    sku: firstVariant?.sku || node.handle,
    category_id: primaryCollection?.id || "",
    category_slug: primaryCollection?.handle || null,
    collection_ids: collections.map((c) => c.id),
    collection_handles: collections.map((c) => c.handle),
    description: node.description || "",
    description_html: node.descriptionHtml || "",
    priceRupees: pricing.priceRupees,
    compareAtPriceRupees: pricing.compareAtPriceRupees,
    currencyCode: pricing.currencyCode,
    price_cents: pricing.price_cents,
    sale_price_cents: pricing.sale_price_cents,
    availableForSale,
    quantityAvailable: rawQty,
    inventory: rawQty,
    inventory_quantity: rawQty,
    image_url: imageUrls[0] || null,
    images: imageUrls,
    author: bookMeta.author,
    publisher: bookMeta.publisher,
    language: bookMeta.language,
    pages: bookMeta.pages,
    binding: bookMeta.binding,
    isbn: bookMeta.isbn,
    year: bookMeta.year,
    dimensions_json: { book: bookMeta },
    meta_title: node.seo?.title || null,
    meta_description: node.seo?.description || null,
    updated_at: node.updatedAt,
    variants,
  };
}

function mapShopifyCollection(node: RawCollectionNode): ShopifyCollection {
  const [titleTa, titleEn] = splitBilingual(node.title, "|");
  return {
    id: node.id,
    slug: node.handle,
    handle: node.handle,
    name: node.title,
    titleTa,
    titleEn,
    description: node.description || "",
    image_url: node.image?.url || null,
    updated_at: node.updatedAt,
  };
}

/* ------------------------------------------------------------------ */
/* Sort Key Helpers                                                    */
/* ------------------------------------------------------------------ */

export type CatalogSortOption = "default" | "newest" | "price-asc" | "price-desc";

export type ShopifyProductSortKey =
  | "BEST_SELLING"
  | "CREATED_AT"
  | "PRICE"
  | "RELEVANCE"
  | "TITLE";

export type ShopifyCollectionProductSortKey =
  | "BEST_SELLING"
  | "COLLECTION_DEFAULT"
  | "CREATED"
  | "PRICE"
  | "TITLE";

export function resolveProductSort(
  sort?: string | null,
  hasSearchQuery = false,
): { sortKey: ShopifyProductSortKey; reverse: boolean } {
  switch (sort) {
    case "newest":
      return { sortKey: "CREATED_AT", reverse: true };
    case "price-asc":
      return { sortKey: "PRICE", reverse: false };
    case "price-desc":
      return { sortKey: "PRICE", reverse: true };
    default:
      return {
        sortKey: hasSearchQuery ? "RELEVANCE" : "BEST_SELLING",
        reverse: false,
      };
  }
}

export function resolveCollectionSort(sort?: string | null): {
  sortKey: ShopifyCollectionProductSortKey;
  reverse: boolean;
} {
  switch (sort) {
    case "newest":
      return { sortKey: "CREATED", reverse: true };
    case "price-asc":
      return { sortKey: "PRICE", reverse: false };
    case "price-desc":
      return { sortKey: "PRICE", reverse: true };
    default:
      return { sortKey: "BEST_SELLING", reverse: false };
  }
}

/* ------------------------------------------------------------------ */
/* Storefront Queries                                                  */
/* ------------------------------------------------------------------ */

const LIST_PRODUCTS_QUERY = /* GraphQL */ `
  ${PRODUCT_FIELDS_FRAGMENT}
  query ListProducts(
    $first: Int!
    $after: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
    $query: String
  ) {
    products(
      first: $first
      after: $after
      sortKey: $sortKey
      reverse: $reverse
      query: $query
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ...ProductFields
      }
    }
  }
`;

export async function listProducts(opts?: {
  first?: number;
  after?: string | null;
  sortKey?: ShopifyProductSortKey;
  reverse?: boolean;
  query?: string;
  availableOnly?: boolean;
}): Promise<{ products: ShopifyBook[]; pageInfo: ShopifyPageInfo }> {
  const first = Math.min(Math.max(opts?.first ?? 24, 1), 250);
  const query = buildShopifySearchQuery({
    search: opts?.query,
    availableOnly: opts?.availableOnly,
  });

  const data = await shopifyFetch<{
    products: { pageInfo: ShopifyPageInfo; nodes: RawProductNode[] };
  }>({
    query: LIST_PRODUCTS_QUERY,
    variables: {
      first,
      after: opts?.after || null,
      sortKey: opts?.sortKey ?? "BEST_SELLING",
      reverse: opts?.reverse ?? false,
      query: query ?? null,
    },
    tags: ["products"],
  });

  const products = (data.products?.nodes || [])
    .filter((node) => matchesVendorFilter(node.vendor))
    .map(mapShopifyProduct);

  return {
    products,
    pageInfo: data.products?.pageInfo ?? { hasNextPage: false, endCursor: null },
  };
}

export async function searchProducts(opts: {
  query: string;
  first?: number;
  after?: string | null;
  sortKey?: ShopifyProductSortKey;
  reverse?: boolean;
  availableOnly?: boolean;
}): Promise<{ products: ShopifyBook[]; pageInfo: ShopifyPageInfo }> {
  const trimmed = opts.query.trim();
  return listProducts({
    first: opts.first ?? 24,
    after: opts.after ?? null,
    sortKey: opts.sortKey ?? (trimmed ? "RELEVANCE" : "BEST_SELLING"),
    reverse: opts.reverse ?? false,
    query: trimmed,
    availableOnly: opts.availableOnly,
  });
}

const PRODUCT_BY_HANDLE_QUERY = /* GraphQL */ `
  ${PRODUCT_FIELDS_FRAGMENT}
  query GetProductByHandle($handle: String!) {
    product(handle: $handle) {
      ...ProductFields
    }
  }
`;

const PRODUCT_BY_ID_QUERY = /* GraphQL */ `
  ${PRODUCT_FIELDS_FRAGMENT}
  query GetProductById($id: ID!) {
    product(id: $id) {
      ...ProductFields
    }
  }
`;

export async function getProductByHandle(handle: string): Promise<ShopifyBook | null> {
  const cleanHandle = handle.trim();
  if (!cleanHandle) return null;

  const data = await shopifyFetch<{ product: RawProductNode | null }>({
    query: PRODUCT_BY_HANDLE_QUERY,
    variables: { handle: cleanHandle },
    tags: ["products", `product:${cleanHandle}`],
  });

  if (!data.product || !matchesVendorFilter(data.product.vendor)) {
    return null;
  }
  return mapShopifyProduct(data.product);
}

export async function getProductByIdOrHandle(idOrHandle: string): Promise<ShopifyBook | null> {
  const clean = decodeURIComponent(idOrHandle).trim();
  if (!clean) return null;

  if (clean.startsWith("gid://shopify/Product/")) {
    const data = await shopifyFetch<{ product: RawProductNode | null }>({
      query: PRODUCT_BY_ID_QUERY,
      variables: { id: clean },
      tags: ["products", `product:${clean}`],
    });
    if (!data.product || !matchesVendorFilter(data.product.vendor)) {
      return null;
    }
    return mapShopifyProduct(data.product);
  }

  return getProductByHandle(clean);
}

const LIST_COLLECTIONS_QUERY = /* GraphQL */ `
  query ListCollections($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        handle
        title
        description
        updatedAt
        image {
          url
          altText
          width
          height
        }
      }
    }
  }
`;

export async function listCollections(opts?: {
  first?: number;
  after?: string | null;
}): Promise<{ collections: ShopifyCollection[]; pageInfo: ShopifyPageInfo }> {
  const first = Math.min(Math.max(opts?.first ?? 50, 1), 250);
  const data = await shopifyFetch<{
    collections: { pageInfo: ShopifyPageInfo; nodes: RawCollectionNode[] };
  }>({
    query: LIST_COLLECTIONS_QUERY,
    variables: {
      first,
      after: opts?.after || null,
    },
    tags: ["collections"],
  });

  return {
    collections: (data.collections?.nodes || []).map(mapShopifyCollection),
    pageInfo: data.collections?.pageInfo ?? { hasNextPage: false, endCursor: null },
  };
}

const COLLECTION_BY_HANDLE_QUERY = /* GraphQL */ `
  ${PRODUCT_FIELDS_FRAGMENT}
  query GetCollectionByHandle(
    $handle: String!
    $first: Int!
    $after: String
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
    $filters: [ProductFilter!]
  ) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      updatedAt
      image {
        url
        altText
        width
        height
      }
      products(
        first: $first
        after: $after
        sortKey: $sortKey
        reverse: $reverse
        filters: $filters
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          ...ProductFields
        }
      }
    }
  }
`;

export async function getCollectionByHandle(
  handle: string,
  opts?: {
    first?: number;
    after?: string | null;
    sortKey?: ShopifyCollectionProductSortKey;
    reverse?: boolean;
    availableOnly?: boolean;
  },
): Promise<{
  collection: ShopifyCollection;
  products: ShopifyBook[];
  pageInfo: ShopifyPageInfo;
} | null> {
  const cleanHandle = handle.trim();
  if (!cleanHandle) return null;

  const first = Math.min(Math.max(opts?.first ?? 24, 1), 250);
  const filters: Record<string, unknown>[] = [];
  const vendor = getVendorFilter();
  if (vendor) {
    filters.push({ productVendor: vendor });
  }
  if (opts?.availableOnly) {
    filters.push({ available: true });
  }

  const data = await shopifyFetch<{
    collection:
      | (RawCollectionNode & {
          products: { pageInfo: ShopifyPageInfo; nodes: RawProductNode[] };
        })
      | null;
  }>({
    query: COLLECTION_BY_HANDLE_QUERY,
    variables: {
      handle: cleanHandle,
      first,
      after: opts?.after || null,
      sortKey: opts?.sortKey ?? "BEST_SELLING",
      reverse: opts?.reverse ?? false,
      filters: filters.length > 0 ? filters : undefined,
    },
    tags: ["collections", "products", `collection:${cleanHandle}`],
  });

  if (!data.collection) return null;

  const products = (data.collection.products?.nodes || [])
    .filter((node) => matchesVendorFilter(node.vendor))
    .map(mapShopifyProduct);

  return {
    collection: mapShopifyCollection(data.collection),
    products,
    pageInfo: data.collection.products?.pageInfo ?? {
      hasNextPage: false,
      endCursor: null,
    },
  };
}

const PRODUCT_RECOMMENDATIONS_QUERY = /* GraphQL */ `
  ${PRODUCT_FIELDS_FRAGMENT}
  query GetProductRecommendations($productId: ID!) {
    productRecommendations(productId: $productId) {
      ...ProductFields
    }
  }
`;

export async function getProductRecommendations(
  productId: string,
): Promise<ShopifyBook[]> {
  if (!productId) return [];
  const data = await shopifyFetch<{
    productRecommendations: RawProductNode[] | null;
  }>({
    query: PRODUCT_RECOMMENDATIONS_QUERY,
    variables: { productId },
    tags: ["products", `recommendations:${productId}`],
  });

  return (data.productRecommendations || [])
    .filter((node) => node.id !== productId && matchesVendorFilter(node.vendor))
    .map(mapShopifyProduct);
}

/* ------------------------------------------------------------------ */
/* Request-Deduplicated Safe Helpers for RSC Pages                     */
/* ------------------------------------------------------------------ */

export type SafeCatalogResult =
  | { ok: true; products: ShopifyBook[]; pageInfo: ShopifyPageInfo }
  | { ok: false; error: string };

export type SafeCollectionsResult =
  | { ok: true; collections: ShopifyCollection[] }
  | { ok: false; error: string };

export type SafeBookLookup =
  | { status: "ok"; product: ShopifyBook }
  | { status: "not_found" }
  | { status: "unavailable"; error: string };

export type SafeCollectionLookup =
  | {
      status: "ok";
      collection: ShopifyCollection;
      products: ShopifyBook[];
      pageInfo: ShopifyPageInfo;
    }
  | { status: "not_found" }
  | { status: "unavailable"; error: string };

export const getCatalogSummarySafe = cache(async (): Promise<{
  ok: boolean;
  products: ShopifyBook[];
  collections: ShopifyCollection[];
  error?: string;
}> => {
  try {
    const [prodRes, colRes] = await Promise.all([
      listProducts({ first: 100 }),
      listCollections({ first: 50 }),
    ]);
    return {
      ok: true,
      products: prodRes.products,
      collections: colRes.collections,
    };
  } catch (err: any) {
    return {
      ok: false,
      products: [],
      collections: [],
      error: err?.message || "Store is temporarily unavailable",
    };
  }
});

export const getBookByHandleSafe = cache(
  async (handleOrId: string): Promise<SafeBookLookup> => {
    try {
      const product = await getProductByIdOrHandle(handleOrId);
      if (!product) return { status: "not_found" };
      return { status: "ok", product };
    } catch (err: any) {
      return {
        status: "unavailable",
        error: err?.message || "Store is temporarily unavailable",
      };
    }
  },
);
