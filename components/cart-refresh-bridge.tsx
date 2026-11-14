"use client";

import { useEffect } from "react";
import { refreshCartCount } from "@/lib/cart-events";

/**
 * Syncs `cart.totalQuantity` from the httpOnly Shopify cart cookie on cold mount
 * and across open browser tabs via BroadcastChannel + storage events.
 */
export function CartRefreshBridge() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = () => {
      void refreshCartCount();
    };

    // Hydrate live cart.totalQuantity from httpOnly cookie
    void refreshCartCount();

    window.addEventListener("infalette-cart-changed", handler);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("infalette-cart");
      bc.onmessage = handler;
    } catch {
      /* BroadcastChannel unsupported */
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === "infalette-cart-bus") handler();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("infalette-cart-changed", handler);
      window.removeEventListener("storage", onStorage);
      bc?.close();
    };
  }, []);

  return null;
}