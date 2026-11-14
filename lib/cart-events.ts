"use client";

export const CART_COUNT_KEY = "infalette-cart-count";
export const CART_TOTAL_KEY = "infalette-cart-total";

export type CartSummary = {
  count: number;
  totalCents: number;
};

function writeToStorage(count: number, totalCents: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_COUNT_KEY, String(Math.max(0, count)));
    localStorage.setItem(CART_TOTAL_KEY, String(Math.max(0, totalCents)));
  } catch {
    /* ignore storage quota errors */
  }
}

export function syncCartSummaryFromCart(
  cart: { totalQuantity?: number; totalCents?: number } | null | undefined,
) {
  if (typeof window === "undefined") return;
  writeToStorage(cart?.totalQuantity ?? 0, cart?.totalCents ?? 0);
  window.dispatchEvent(new CustomEvent("infalette-cart-synced"));
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
    /* ignore */
  }
}

export function notifyCartChanged() {
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
    /* ignore */
  }
}

export function optimisticAdjustCart(deltaCount: number, deltaCents = 0): () => void {
  if (typeof window === "undefined") return () => {};
  const prev = readFromStorage();
  const nextCount = Math.max(0, prev.count + deltaCount);
  const nextTotal = Math.max(0, prev.totalCents + deltaCents);
  writeToStorage(nextCount, nextTotal);
  window.dispatchEvent(new CustomEvent("infalette-cart-optimistic"));
  return () => {
    writeToStorage(prev.count, prev.totalCents);
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
  if (typeof window === "undefined") return { count: 0, totalCents: 0 };
  try {
    const res = await fetch("/api/cart-summary", { cache: "no-store" });
    if (!res.ok) return readFromStorage();
    const data = await res.json();
    const count = Number(data?.count ?? 0);
    const totalCents = Number(data?.totalCents ?? 0);
    const summary = {
      count: Number.isFinite(count) ? Math.max(0, count) : 0,
      totalCents: Number.isFinite(totalCents) ? Math.max(0, totalCents) : 0,
    };
    writeToStorage(summary.count, summary.totalCents);
    window.dispatchEvent(new CustomEvent("infalette-cart-synced"));
    return summary;
  } catch {
    return readFromStorage();
  }
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