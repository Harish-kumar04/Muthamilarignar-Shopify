import { NextRequest, NextResponse } from "next/server";
import {
  getProductRecommendations,
  listProducts,
  type ShopifyBook,
} from "@/lib/shopify";
import {
  ShopifyCartError,
  cartCreate,
  cartDiscountCodesUpdate,
  cartLinesAdd,
  cartLinesRemove,
  cartLinesUpdate,
  clearCartIdOnResponse,
  getCart,
  getCartIdFromCookies,
  getFreeShippingThresholdRupees,
  resolveVariantForCart,
  setCartIdOnResponse,
  type ShopifyCart,
} from "@/lib/shopify-cart";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, no-cache, must-revalidate",
};

function slimRecommendation(b: ShopifyBook) {
  return {
    id: b.id,
    variant_id: b.variant_id,
    slug: b.slug,
    name: b.name,
    author: b.author,
    price_cents: b.price_cents,
    sale_price_cents: b.sale_price_cents,
    availableForSale: b.availableForSale,
    quantityAvailable: b.quantityAvailable,
    inventory: b.inventory,
    image_url: b.image_url,
    images: b.images,
  };
}

async function loadRecommendations(cart: ShopifyCart | null) {
  const inCartProductIds = new Set((cart?.lines || []).map((l) => l.productId));
  const seedProductId = cart?.lines?.[0]?.productId || null;

  try {
    const collected: ShopifyBook[] = [];
    const seen = new Set<string>(inCartProductIds);

    if (seedProductId) {
      try {
        const recs = await getProductRecommendations(seedProductId);
        for (const r of recs) {
          if (r.availableForSale && !seen.has(r.id)) {
            seen.add(r.id);
            collected.push(r);
          }
          if (collected.length >= 4) break;
        }
      } catch {
        // Fall through to listProducts
      }
    }

    if (collected.length < 4) {
      const list = await listProducts({ first: 12, availableOnly: true });
      for (const b of list.products) {
        if (b.availableForSale && !seen.has(b.id)) {
          seen.add(b.id);
          collected.push(b);
        }
        if (collected.length >= 4) break;
      }
    }

    return collected.slice(0, 4).map(slimRecommendation);
  } catch {
    return [];
  }
}

function errorResponse(err: unknown) {
  const status = err instanceof ShopifyCartError ? err.status : 500;
  const message =
    err instanceof Error && err.message
      ? err.message
      : "Store is temporarily unavailable";
  return NextResponse.json(
    { error: message },
    { status, headers: NO_STORE_HEADERS },
  );
}

export async function GET() {
  const freeShippingThresholdRupees = getFreeShippingThresholdRupees();
  try {
    const cartId = await getCartIdFromCookies();
    let cart: ShopifyCart | null = null;
    let shouldClearCookie = false;

    if (cartId) {
      cart = await getCart(cartId);
      if (!cart) {
        shouldClearCookie = true;
      }
    }

    const recommendations = await loadRecommendations(cart);
    const res = NextResponse.json(
      { cart, recommendations, freeShippingThresholdRupees },
      { headers: NO_STORE_HEADERS },
    );
    if (shouldClearCookie) {
      clearCartIdOnResponse(res);
    }
    return res;
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  const freeShippingThresholdRupees = getFreeShippingThresholdRupees();
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const action = String(body?.action || "");

  try {
    if (action === "buyNow") {
      const qty = Math.max(1, Math.floor(Number(body?.quantity) || 1));
      const variant = await resolveVariantForCart({
        merchandiseId: body?.merchandiseId,
        productId: body?.productId,
      });

      if (!variant.availableForSale) {
        throw new ShopifyCartError("This book is currently out of stock.", 400);
      }
      if (
        typeof variant.quantityAvailable === "number" &&
        qty > variant.quantityAvailable
      ) {
        throw new ShopifyCartError(
          variant.quantityAvailable <= 0
            ? "This book is currently out of stock."
            : `Only ${variant.quantityAvailable} copies available in stock.`,
          400,
        );
      }

      const oneLineCart = await cartCreate([
        { merchandiseId: variant.merchandiseId, quantity: qty },
      ]);
      if (!oneLineCart.checkoutUrl) {
        throw new ShopifyCartError(
          "Shopify checkout URL was not returned. Please try again.",
          502,
        );
      }

      return NextResponse.json(
        { checkoutUrl: oneLineCart.checkoutUrl },
        { headers: NO_STORE_HEADERS },
      );
    }

    if (action === "add") {
      const qty = Math.max(1, Math.floor(Number(body?.quantity) || 1));
      const variant = await resolveVariantForCart({
        merchandiseId: body?.merchandiseId,
        productId: body?.productId,
      });

      if (!variant.availableForSale) {
        throw new ShopifyCartError("This book is currently out of stock.", 400);
      }

      const existingCartId = await getCartIdFromCookies();
      let existingCart: ShopifyCart | null = null;
      if (existingCartId) {
        existingCart = await getCart(existingCartId);
      }

      const existingQty =
        existingCart?.lines.find((l) => l.merchandiseId === variant.merchandiseId)
          ?.quantity ?? 0;

      if (
        typeof variant.quantityAvailable === "number" &&
        existingQty + qty > variant.quantityAvailable
      ) {
        throw new ShopifyCartError(
          variant.quantityAvailable <= 0
            ? "This book is currently out of stock."
            : `Only ${variant.quantityAvailable} copies available in stock (you already have ${existingQty} in cart).`,
          400,
        );
      }

      let cart: ShopifyCart;
      if (existingCart) {
        cart = await cartLinesAdd(existingCart.id, [
          { merchandiseId: variant.merchandiseId, quantity: qty },
        ]);
      } else {
        cart = await cartCreate([
          { merchandiseId: variant.merchandiseId, quantity: qty },
        ]);
      }

      const res = NextResponse.json(
        { cart, freeShippingThresholdRupees },
        { headers: NO_STORE_HEADERS },
      );
      setCartIdOnResponse(res, cart.id);
      return res;
    }

    const cartId = await getCartIdFromCookies();
    if (!cartId) {
      throw new ShopifyCartError("Your cart is empty.", 400);
    }

    if (action === "update") {
      const lineId = String(body?.lineId || "").trim();
      const qty = Math.floor(Number(body?.quantity) || 0);
      if (!lineId) {
        throw new ShopifyCartError("Missing cart line ID.", 400);
      }

      let cart: ShopifyCart;
      if (qty <= 0) {
        cart = await cartLinesRemove(cartId, [lineId]);
      } else {
        const current = await getCart(cartId);
        if (!current) {
          throw new ShopifyCartError("Your cart has expired. Please add items again.", 404);
        }
        const targetLine = current.lines.find((l) => l.id === lineId);
        if (targetLine) {
          if (!targetLine.availableForSale && qty > targetLine.quantity) {
            throw new ShopifyCartError("This book is currently out of stock.", 400);
          }
          if (
            typeof targetLine.quantityAvailable === "number" &&
            qty > targetLine.quantityAvailable
          ) {
            throw new ShopifyCartError(
              `Only ${targetLine.quantityAvailable} copies available in stock.`,
              400,
            );
          }
        }
        cart = await cartLinesUpdate(cartId, [{ id: lineId, quantity: qty }]);
      }

      const res = NextResponse.json(
        { cart, freeShippingThresholdRupees },
        { headers: NO_STORE_HEADERS },
      );
      setCartIdOnResponse(res, cart.id);
      return res;
    }

    if (action === "remove") {
      const lineId = String(body?.lineId || "").trim();
      if (!lineId) {
        throw new ShopifyCartError("Missing cart line ID.", 400);
      }
      const cart = await cartLinesRemove(cartId, [lineId]);
      const res = NextResponse.json(
        { cart, freeShippingThresholdRupees },
        { headers: NO_STORE_HEADERS },
      );
      setCartIdOnResponse(res, cart.id);
      return res;
    }

    if (action === "discount") {
      const rawCode = typeof body?.code === "string" ? body.code.trim() : "";
      const codes = rawCode ? [rawCode] : [];
      let cart = await cartDiscountCodesUpdate(cartId, codes);

      if (rawCode) {
        const matched = cart.discountCodes.find(
          (d) => d.code.toUpperCase() === rawCode.toUpperCase(),
        );
        if (!matched || !matched.applicable) {
          // Clear inapplicable code so cart stays clean and return clear error
          cart = await cartDiscountCodesUpdate(cartId, []);
          return NextResponse.json(
            {
              error: `Coupon "${rawCode.toUpperCase()}" is invalid or not applicable to your cart.`,
              cart,
              freeShippingThresholdRupees,
            },
            { status: 400, headers: NO_STORE_HEADERS },
          );
        }
      }

      const res = NextResponse.json(
        { cart, freeShippingThresholdRupees },
        { headers: NO_STORE_HEADERS },
      );
      setCartIdOnResponse(res, cart.id);
      return res;
    }

    return NextResponse.json(
      { error: `Unsupported cart action: ${action}` },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  } catch (err) {
    return errorResponse(err);
  }
}
