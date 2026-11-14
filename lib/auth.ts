"use client";

/**
 * Storefront customer auth stubs.
 * TODO shopify: replace with Shopify Customer Account API / Storefront customerAccessToken.
 */

export const STOREFRONT_TOKEN_KEY = "shopify_customer_access_token";
export const STOREFRONT_REFRESH_KEY = "shopify_customer_refresh_token";

export function getStorefrontToken(): string | null {
  // TODO shopify: read Shopify customer session / access token
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STOREFRONT_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function isStorefrontLoggedIn(): boolean {
  // TODO shopify: verify active Shopify customer session
  return !!getStorefrontToken();
}

export function setStorefrontTokens(access: string, refresh?: string): void {
  // TODO shopify: persist Shopify customerAccessToken / session cookie
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STOREFRONT_TOKEN_KEY, access);
    if (refresh) window.localStorage.setItem(STOREFRONT_REFRESH_KEY, refresh);
  } catch {
    /* ignore quota errors */
  }
}

export function clearStorefrontTokens(): void {
  // TODO shopify: revoke Shopify customerAccessTokenDelete & clear session
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STOREFRONT_TOKEN_KEY);
    window.localStorage.removeItem(STOREFRONT_REFRESH_KEY);
  } catch {
    /* ignore */
  }
}

export function subscribeStorefrontAuth(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === STOREFRONT_TOKEN_KEY || e.key === STOREFRONT_REFRESH_KEY) handler();
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}