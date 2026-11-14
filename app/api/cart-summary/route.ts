import { NextResponse } from "next/server";
import {
  clearCartIdOnResponse,
  getCart,
  getCartIdFromCookies,
  getFreeShippingThresholdRupees,
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

    const cart = await getCart(cartId);
    const res = NextResponse.json(
      {
        count: cart?.totalQuantity ?? 0,
        totalCents: cart?.totalCents ?? 0,
        freeShippingThresholdRupees,
      },
      {
        headers: {
          "Cache-Control": "private, no-store, no-cache, must-revalidate",
        },
      },
    );
    if (!cart) {
      clearCartIdOnResponse(res);
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