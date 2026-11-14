import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // TODO shopify: read Shopify cart ID from cookie and query `cart(id: $cartId) { totalQuantity cost { subtotalAmount { amount } } }`
  return NextResponse.json({ count: 0, totalCents: 0 });
}