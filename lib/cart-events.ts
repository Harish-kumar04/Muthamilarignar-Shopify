"use client";

/**
 * Tiny event bus + counter helpers for the storefront cart.
 * TODO shopify: sync cart count and subtotal from Shopify Cart ID in cookie/localStorage.
 */

export const CART_COUNT_KEY = "infalette-cart-count";
export const CART_TOTAL_KEY = "infalette-cart-total";

type CartSummary = {
  count: number;
  totalCents: number;
};

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("infalette-cart-changed"));
  try {
    const bc = new BroadcastChannel("infalette-cart");
    bc.postMessage({});
    bc.close();
  } catch {
    /* unsupported */
  }
  try {
    localStorage.setItem("infalette-cart-bus", String(Date.now()));
  } catch {
    /* ignore quota errors */
  }
}

export function notifyCartChanged() {
  emit();
}

export function optimisticAdjustCart(deltaCount: number, deltaCents = 0): () => void {
  if (typeof window === "undefined") return () => {};
  const prev = readFromStorage();
  const nextCount = Math.max(0, prev.count + deltaCount);
  const nextTotal = Math.max(0, prev.totalCents + deltaCents);
  try {
    localStorage.setItem(CART_COUNT_KEY, String(nextCount));
    localStorage.setItem(CART_TOTAL_KEY, String(nextTotal));
  } catch {
    // ignore storage errors
  }
  window.dispatchEvent(new CustomEvent("infalette-cart-optimistic"));
  return () => {
    try {
      localStorage.setItem(CART_COUNT_KEY, String(prev.count));
      localStorage.setItem(CART_TOTAL_KEY, String(prev.totalCents));
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent("infalette-cart-optimistic"));
  };
}

export function openMiniCart() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("infalette-open-mini-cart"));
}

export function closeMiniCart() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("infalette-close-mini-cart"));
}

export async function refreshCartCount(): Promise<CartSummary> {
  // TODO shopify: fetch `/api/cart-summary` backed by Shopify `cart(id: $cartId)`
  return readFromStorage();
}

export function readFromStorage(): CartSummary {
  if (typeof window === "undefined") return { count: 0, totalCents: 0 };
  const count = Number(localStorage.getItem(CART_COUNT_KEY) || 0);
  const totalCents = Number(localStorage.getItem(CART_TOTAL_KEY) || 0);
  return {
    count: Number.isFinite(count) ? count : 0,
    totalCents: Number.isFinite(totalCents) ? totalCents : 0,
  };
}