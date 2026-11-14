import type { NextResponse } from "next/server";
import { splitBilingual } from "@/lib/i18n";
import {
  SHOPIFY_STOREFRONT_API_VERSION,
  ShopifyConfigError,
  getShopifyConfig,
} from "@/lib/shopify";

export const CART_COOKIE_NAME = "shopify_cart_id";
export const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const CART_TIMEOUT_MS = 8_000;

export class ShopifyCartError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ShopifyCartError";
    this.status = status;
  }
}

export interface ShopifyCartLine {
  id: string;
  quantity: number;
  merchandiseId: string;
  variantTitle: string;
  productId: string;
  handle: string;
  slug: string;
  title: string;
  titleTa: string;
  titleEn: string;
  author: string | null;
  imageUrl: string | null;
  availableForSale: boolean;
  quantityAvailable: number | null;
  unitPriceRupees: number;
  unitPriceCents: number;
  compareAtUnitPriceCents: number | null;
  lineTotalRupees: number;
  lineTotalCents: number;
  currencyCode: string;
}

export interface ShopifyDiscountCode {
  code: string;
  applicable: boolean;
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  subtotalRupees: number;
  subtotalCents: number;
  totalRupees: number;
  totalCents: number;
  discountCents: number;
  currencyCode: string;
  discountCodes: ShopifyDiscountCode[];
  lines: ShopifyCartLine[];
}

export function getFreeShippingThresholdRupees(): number {
  const raw = (process.env.FREE_SHIPPING_THRESHOLD ?? "").trim();
  if (!raw) return 500;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 500;
}

export function getShopifyHostedAccountUrls(): {
  domain: string;
  accountUrl: string;
  loginUrl: string;
  ordersUrl: string;
  orderLookupUrl: string;
} | null {
  const rawDomain = (process.env.SHOPIFY_STORE_DOMAIN ?? "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
  if (!rawDomain) return null;
  const base = `https://${rawDomain}`;
  return {
    domain: rawDomain,
    accountUrl: `${base}/account`,
    loginUrl: `${base}/account/login`,
    ordersUrl: `${base}/account`,
    orderLookupUrl: `${base}/account`,
  };
}

export async function getCartIdFromCookies(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const val = cookies().get(CART_COOKIE_NAME)?.value?.trim();
  return val || null;
}

export function setCartIdOnResponse(res: NextResponse, cartId: string): void {
  res.cookies.set(CART_COOKIE_NAME, cartId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
}

export function clearCartIdOnResponse(res: NextResponse): void {
  res.cookies.set(CART_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

/* ------------------------------------------------------------------ */
/* Uncached Storefront GraphQL Request Helper (cache: "no-store")      */
/* ------------------------------------------------------------------ */

async function shopifyCartFetch<
  TData,
  TVars extends Record<string, unknown> = Record<string, unknown>,
>(query: string, variables?: TVars): Promise<TData> {
  let domain: string;
  let token: string;
  try {
    ({ domain, token } = getShopifyConfig());
  } catch (err: any) {
    throw new ShopifyCartError(
      err instanceof ShopifyConfigError
        ? "Store is temporarily unavailable"
        : err?.message || "Store is temporarily unavailable",
      503,
    );
  }

  const endpoint = `https://${domain}/api/${SHOPIFY_STOREFRONT_API_VERSION}/graphql.json`;

  const runQuery = async (q: string): Promise<{ data?: TData; errors?: any[] }> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CART_TIMEOUT_MS);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Shopify-Storefront-Access-Token": token,
        },
        body: JSON.stringify({ query: q, variables }),
        cache: "no-store",
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new ShopifyCartError(
          `Shopify Cart API error (HTTP ${res.status}). Please try again.`,
          502,
        );
      }
      return (await res.json()) as { data?: TData; errors?: any[] };
    } catch (err: any) {
      if (err instanceof ShopifyCartError) throw err;
      if (err?.name === "AbortError") {
        throw new ShopifyCartError(
          "Shopify Cart request timed out. Please try again.",
          504,
        );
      }
      throw new ShopifyCartError(
        err?.message || "Store is temporarily unavailable",
        503,
      );
    } finally {
      clearTimeout(timer);
    }
  };

  let payload = await runQuery(query);

  if (
    payload.errors?.length &&
    query.includes("quantityAvailable") &&
    payload.errors.some((e) => String(e?.message || "").includes("quantityAvailable"))
  ) {
    const fallbackQuery = query.replace(/\bquantityAvailable\b/g, "");
    payload = await runQuery(fallbackQuery);
  }

  if (payload.errors?.length) {
    const msg = payload.errors.map((e) => e?.message || "GraphQL error").join("; ");
    throw new ShopifyCartError(msg, 502);
  }

  if (!payload.data) {
    throw new ShopifyCartError("Empty response from Shopify Cart API", 502);
  }

  return payload.data;
}

/* ------------------------------------------------------------------ */
/* GraphQL Fragments & Mapping                                         */
/* ------------------------------------------------------------------ */

const CART_FRAGMENT = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    discountCodes {
      code
      applicable
    }
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost {
          amountPerQuantity {
            amount
            currencyCode
          }
          compareAtAmountPerQuantity {
            amount
            currencyCode
          }
          subtotalAmount {
            amount
            currencyCode
          }
          totalAmount {
            amount
            currencyCode
          }
        }
        merchandise {
          ... on ProductVariant {
            id
            title
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
            image {
              url
              altText
            }
            product {
              id
              handle
              title
              featuredImage {
                url
                altText
              }
              metafield(namespace: "custom", key: "author") {
                value
              }
            }
          }
        }
      }
    }
  }
`;

interface RawCartUserError {
  field?: string[] | null;
  message: string;
  code?: string | null;
}

function parseMoney(amount?: string | null): number {
  if (!amount) return 0;
  const n = Number.parseFloat(amount);
  return Number.isFinite(n) ? n : 0;
}

function mapCart(raw: any): ShopifyCart {
  const subtotalRupees = parseMoney(raw?.cost?.subtotalAmount?.amount);
  const totalRupees = parseMoney(raw?.cost?.totalAmount?.amount);
  const subtotalCents = Math.round(subtotalRupees * 100);
  const totalCents = Math.round(totalRupees * 100);
  const currencyCode =
    raw?.cost?.totalAmount?.currencyCode ||
    raw?.cost?.subtotalAmount?.currencyCode ||
    "INR";

  const lines: ShopifyCartLine[] = (raw?.lines?.nodes || [])
    .filter((n: any) => Boolean(n?.id && n?.merchandise?.id))
    .map((node: any) => {
      const merch = node.merchandise;
      const prod = merch.product || {};
      const title = String(prod.title || merch.title || "Book");
      const [titleTa, titleEn] = splitBilingual(title, "|");

      const unitRupees = parseMoney(
        node.cost?.amountPerQuantity?.amount ?? merch.price?.amount,
      );
      const compareUnitRupees = parseMoney(
        node.cost?.compareAtAmountPerQuantity?.amount ?? merch.compareAtPrice?.amount,
      );
      const lineTotalRupees = parseMoney(
        node.cost?.totalAmount?.amount ?? node.cost?.subtotalAmount?.amount,
      );

      const qtyAvail =
        typeof merch.quantityAvailable === "number" ? merch.quantityAvailable : null;

      return {
        id: String(node.id),
        quantity: Number(node.quantity) || 1,
        merchandiseId: String(merch.id),
        variantTitle: String(merch.title || ""),
        productId: String(prod.id || ""),
        handle: String(prod.handle || ""),
        slug: String(prod.handle || ""),
        title,
        titleTa,
        titleEn,
        author: prod.metafield?.value?.trim() || null,
        imageUrl: merch.image?.url || prod.featuredImage?.url || null,
        availableForSale: Boolean(merch.availableForSale),
        quantityAvailable: qtyAvail,
        unitPriceRupees: unitRupees,
        unitPriceCents: Math.round(unitRupees * 100),
        compareAtUnitPriceCents:
          compareUnitRupees > unitRupees ? Math.round(compareUnitRupees * 100) : null,
        lineTotalRupees,
        lineTotalCents: Math.round(lineTotalRupees * 100),
        currencyCode:
          node.cost?.totalAmount?.currencyCode || merch.price?.currencyCode || currencyCode,
      };
    });

  // Sum line-level discounts + order-level discounts
  const linesGrossCents = lines.reduce(
    (sum, l) => sum + l.unitPriceCents * l.quantity,
    0,
  );
  const discountCents = Math.max(
    0,
    Math.max(linesGrossCents, subtotalCents) - totalCents,
  );

  const discountCodes: ShopifyDiscountCode[] = Array.isArray(raw?.discountCodes)
    ? raw.discountCodes
        .filter((d: any) => typeof d?.code === "string" && d.code.trim())
        .map((d: any) => ({
          code: d.code.trim().toUpperCase(),
          applicable: Boolean(d.applicable),
        }))
    : [];

  return {
    id: String(raw.id),
    checkoutUrl: String(raw.checkoutUrl || ""),
    totalQuantity: Number(raw.totalQuantity) || 0,
    subtotalRupees,
    subtotalCents,
    totalRupees,
    totalCents,
    discountCents,
    currencyCode,
    discountCodes,
    lines,
  };
}

function assertNoUserErrors(userErrors?: RawCartUserError[] | null): void {
  if (userErrors && userErrors.length > 0) {
    throw new ShopifyCartError(userErrors.map((e) => e.message).join(" "), 400);
  }
}

/* ------------------------------------------------------------------ */
/* Live Variant Lookup (for availableForSale & quantityAvailable)      */
/* ------------------------------------------------------------------ */

const VARIANT_AVAILABILITY_QUERY = /* GraphQL */ `
  query GetVariantAvailability($id: ID!) {
    node(id: $id) {
      ... on ProductVariant {
        id
        availableForSale
        quantityAvailable
      }
      ... on Product {
        id
        availableForSale
        variants(first: 10) {
          nodes {
            id
            availableForSale
            quantityAvailable
          }
        }
      }
    }
  }
`;

export async function resolveVariantForCart(input: {
  merchandiseId?: string | null;
  productId?: string | null;
}): Promise<{
  merchandiseId: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
}> {
  const targetId = (input.merchandiseId || input.productId || "").trim();
  if (!targetId || !targetId.startsWith("gid://shopify/")) {
    throw new ShopifyCartError("Invalid product or variant ID.", 400);
  }

  const data = await shopifyCartFetch<{ node: any | null }>(
    VARIANT_AVAILABILITY_QUERY,
    { id: targetId },
  );

  if (!data.node) {
    throw new ShopifyCartError("This book could not be found in the store.", 404);
  }

  if (targetId.startsWith("gid://shopify/ProductVariant/")) {
    return {
      merchandiseId: String(data.node.id),
      availableForSale: Boolean(data.node.availableForSale),
      quantityAvailable:
        typeof data.node.quantityAvailable === "number"
          ? data.node.quantityAvailable
          : null,
    };
  }

  const variants: any[] = data.node.variants?.nodes || [];
  const chosen = variants.find((v) => v.availableForSale) || variants[0];
  if (!chosen?.id) {
    throw new ShopifyCartError("No purchasable edition found for this book.", 400);
  }

  return {
    merchandiseId: String(chosen.id),
    availableForSale: Boolean(data.node.availableForSale && chosen.availableForSale),
    quantityAvailable:
      typeof chosen.quantityAvailable === "number" ? chosen.quantityAvailable : null,
  };
}

/* ------------------------------------------------------------------ */
/* Shopify Storefront Cart Queries & Mutations                         */
/* ------------------------------------------------------------------ */

const GET_CART_QUERY = /* GraphQL */ `
  ${CART_FRAGMENT}
  query GetCart($cartId: ID!) {
    cart(id: $cartId) {
      ...CartFields
    }
  }
`;

export async function getCart(cartId: string): Promise<ShopifyCart | null> {
  const clean = cartId.trim();
  if (!clean) return null;
  const data = await shopifyCartFetch<{ cart: any | null }>(GET_CART_QUERY, {
    cartId: clean,
  });
  if (!data.cart) return null;
  return mapCart(data.cart);
}

const CART_CREATE_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENT}
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

export async function cartCreate(
  lines: { merchandiseId: string; quantity: number }[] = [],
  discountCodes?: string[],
): Promise<ShopifyCart> {
  const input: Record<string, unknown> = {};
  if (lines.length > 0) {
    input.lines = lines.map((l) => ({
      merchandiseId: l.merchandiseId,
      quantity: l.quantity,
    }));
  }
  if (discountCodes && discountCodes.length > 0) {
    input.discountCodes = discountCodes;
  }

  const data = await shopifyCartFetch<{
    cartCreate: { cart: any | null; userErrors: RawCartUserError[] };
  }>(CART_CREATE_MUTATION, { input });

  assertNoUserErrors(data.cartCreate?.userErrors);
  if (!data.cartCreate?.cart) {
    throw new ShopifyCartError("Could not create cart. Please try again.", 502);
  }
  return mapCart(data.cartCreate.cart);
}

const CART_LINES_ADD_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENT}
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

export async function cartLinesAdd(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[],
): Promise<ShopifyCart> {
  const data = await shopifyCartFetch<{
    cartLinesAdd: { cart: any | null; userErrors: RawCartUserError[] };
  }>(CART_LINES_ADD_MUTATION, {
    cartId,
    lines: lines.map((l) => ({
      merchandiseId: l.merchandiseId,
      quantity: l.quantity,
    })),
  });

  assertNoUserErrors(data.cartLinesAdd?.userErrors);
  if (!data.cartLinesAdd?.cart) {
    throw new ShopifyCartError("Cart expired or not found.", 404);
  }
  return mapCart(data.cartLinesAdd.cart);
}

const CART_LINES_UPDATE_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENT}
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

export async function cartLinesUpdate(
  cartId: string,
  lines: { id: string; quantity: number; merchandiseId?: string }[],
): Promise<ShopifyCart> {
  const data = await shopifyCartFetch<{
    cartLinesUpdate: { cart: any | null; userErrors: RawCartUserError[] };
  }>(CART_LINES_UPDATE_MUTATION, {
    cartId,
    lines: lines.map((l) => ({
      id: l.id,
      quantity: l.quantity,
      ...(l.merchandiseId ? { merchandiseId: l.merchandiseId } : {}),
    })),
  });

  assertNoUserErrors(data.cartLinesUpdate?.userErrors);
  if (!data.cartLinesUpdate?.cart) {
    throw new ShopifyCartError("Could not update cart line.", 404);
  }
  return mapCart(data.cartLinesUpdate.cart);
}

const CART_LINES_REMOVE_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENT}
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

export async function cartLinesRemove(
  cartId: string,
  lineIds: string[],
): Promise<ShopifyCart> {
  const data = await shopifyCartFetch<{
    cartLinesRemove: { cart: any | null; userErrors: RawCartUserError[] };
  }>(CART_LINES_REMOVE_MUTATION, {
    cartId,
    lineIds,
  });

  assertNoUserErrors(data.cartLinesRemove?.userErrors);
  if (!data.cartLinesRemove?.cart) {
    throw new ShopifyCartError("Could not remove item from cart.", 404);
  }
  return mapCart(data.cartLinesRemove.cart);
}

const CART_DISCOUNT_CODES_UPDATE_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENT}
  mutation CartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]) {
    cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

export async function cartDiscountCodesUpdate(
  cartId: string,
  discountCodes: string[],
): Promise<ShopifyCart> {
  const data = await shopifyCartFetch<{
    cartDiscountCodesUpdate: { cart: any | null; userErrors: RawCartUserError[] };
  }>(CART_DISCOUNT_CODES_UPDATE_MUTATION, {
    cartId,
    discountCodes,
  });

  assertNoUserErrors(data.cartDiscountCodesUpdate?.userErrors);
  if (!data.cartDiscountCodesUpdate?.cart) {
    throw new ShopifyCartError("Could not update discount code.", 404);
  }
  return mapCart(data.cartDiscountCodesUpdate.cart);
}
