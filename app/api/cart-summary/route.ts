import { NextResponse } from "next/server";
import {
  getCartIdFromCookies,
  getFreeShippingThresholdRupees,
  loadAndSanitizeCart,
  setCartIdOnResponse,
} from "@/lib/shopify-cart";

export const dynamic = "force-dynamic";

export async function GET() {
  const freeShippingThresholdRupees = getFreeShippingThresholdRupees();
  try {
    const cartId = await getCartIdFromCookies();
    if (!cartId) {
      return NextResponse.json(
        { count: 0, totalCents: 0, freeShippingThresholdRupees },
        {
          headers: {
            "Cache-Control": "private, no-store, no-cache, must-revalidate",
          },
        },
      );
    }

    const { cart, replacedCartId } = await loadAndSanitizeCart(cartId, {
      createIfEmptyOrInvalid: true,
    });
    const res = NextResponse.json(
      {
        count: cart?.totalQuantity ?? 0,
        totalCents: cart?.subtotalCents ?? cart?.totalCents ?? 0,
        freeShippingThresholdRupees,
      },
      {
        headers: {
          "Cache-Control": "private, no-store, no-cache, must-revalidate",
        },
      },
    );
    if (replacedCartId && cart?.id) {
      setCartIdOnResponse(res, cart.id);
    }
    return res;
  } catch {
    return NextResponse.json(
      { count: 0, totalCents: 0, freeShippingThresholdRupees },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store, no-cache, must-revalidate",
        },
      },
    );
  }
}