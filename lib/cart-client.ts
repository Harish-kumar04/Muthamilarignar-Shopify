import {
  getCartSessionId,
  isUuidProductId,
  PRODUCT_UUID_RE,
} from "./cart-session";

export { getCartSessionId, isUuidProductId, PRODUCT_UUID_RE };

/**
 * Lightweight client add-to-cart helper.
 * TODO shopify: wire to Shopify Storefront API `cartCreate` / `cartLinesAdd` mutation.
 */
export async function quickAddToCart(
  _productId: string,
  _quantity = 1,
) {
  // TODO shopify: call Shopify Storefront Cart mutation using variant merchandiseId
  throw new Error("TODO shopify: cart add is not wired yet");
}
