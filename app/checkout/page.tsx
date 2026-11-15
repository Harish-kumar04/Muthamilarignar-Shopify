import { redirect } from "next/navigation";
import { getCartIdFromCookies, loadAndSanitizeCart } from "@/lib/shopify-cart";
import { isVariantOutOfStock } from "@/lib/stock";

export const dynamic = "force-dynamic";

export default async function CheckoutRedirectPage() {
  const cartId = await getCartIdFromCookies();
  if (!cartId) {
    redirect("/cart");
  }

  let checkoutUrl: string | null = null;
  try {
    const { cart } = await loadAndSanitizeCart(cartId, {
      createIfEmptyOrInvalid: false,
    });
    const hasOutOfStockLine = Boolean(
      cart?.lines.some((l) =>
        isVariantOutOfStock(l.availableForSale, l.quantityAvailable),
      ),
    );
    if (cart && cart.lines.length > 0 && cart.totalQuantity > 0 && !hasOutOfStockLine && cart.checkoutUrl) {
      checkoutUrl = cart.checkoutUrl;
    }
  } catch {
    redirect("/cart");
  }

  if (checkoutUrl) {
    redirect(checkoutUrl);
  }

  redirect("/cart");
}