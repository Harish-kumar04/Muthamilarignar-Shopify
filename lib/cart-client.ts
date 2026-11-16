import type { ShopifyCart } from "./shopify-cart";
import { notifyCartChanged, syncCartSummaryFromCart } from "./cart-events";

export interface CartRecommendation {
  id: string;
  variant_id?: string | null;
  slug: string;
  name: string;
  author?: string | null;
  price_cents: number;
  sale_price_cents?: number | null;
  availableForSale: boolean;
  quantityAvailable?: number | null;
  inventory?: number | null;
  image_url?: string | null;
  images?: string[];
}

export interface CartApiResponse {
  cart: ShopifyCart | null;
  recommendations?: CartRecommendation[];
}

export function isShopifyCatalogId(id: unknown): boolean {
  return typeof id === "string" && id.trim().startsWith("gid://shopify/");
}

async function callCartApi<T = any>(init?: RequestInit): Promise<T> {
  const res = await fetch("/api/cart", {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      data?.error || "Store is temporarily unavailable. Please try again.",
    );
  }
  return data as T;
}

export async function fetchCartState(): Promise<CartApiResponse> {
  const res = await callCartApi<CartApiResponse>({ method: "GET" });
  syncCartSummaryFromCart(res.cart);
  return res;
}

export async function addToCartClient(opts: {
  merchandiseId?: string | null;
  productId?: string | null;
  quantity?: number;
}): Promise<CartApiResponse> {
  const res = await callCartApi<CartApiResponse>({
    method: "POST",
    body: JSON.stringify({
      action: "add",
      merchandiseId: opts.merchandiseId || null,
      productId: opts.productId || null,
      quantity: opts.quantity ?? 1,
    }),
  });
  syncCartSummaryFromCart(res.cart);
  notifyCartChanged();
  return res;
}

export async function buyNowClient(opts: {
  merchandiseId?: string | null;
  productId?: string | null;
  quantity?: number;
}): Promise<{ checkoutUrl: string }> {
  return callCartApi<{ checkoutUrl: string }>({
    method: "POST",
    body: JSON.stringify({
      action: "buyNow",
      merchandiseId: opts.merchandiseId || null,
      productId: opts.productId || null,
      quantity: opts.quantity ?? 1,
    }),
  });
}

export async function updateCartLineClient(
  lineId: string,
  quantity: number,
): Promise<CartApiResponse> {
  const res = await callCartApi<CartApiResponse>({
    method: "POST",
    body: JSON.stringify({
      action: "update",
      lineId,
      quantity,
    }),
  });
  syncCartSummaryFromCart(res.cart);
  return res;
}

export async function removeCartLineClient(
  lineId: string,
): Promise<CartApiResponse> {
  const res = await callCartApi<CartApiResponse>({
    method: "POST",
    body: JSON.stringify({
      action: "remove",
      lineId,
    }),
  });
  syncCartSummaryFromCart(res.cart);
  return res;
}

export async function applyCartDiscountClient(
  code: string | null,
): Promise<CartApiResponse> {
  const res = await fetch("/api/cart", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "discount",
      code: code ? code.trim() : "",
    }),
  });
  const data = await res.json().catch(() => null);
  if (data && "cart" in data) {
    syncCartSummaryFromCart(data.cart);
  }
  if (!res.ok) {
    throw new Error(data?.error || "Invalid or inapplicable coupon code.");
  }
  return data as CartApiResponse;
}
