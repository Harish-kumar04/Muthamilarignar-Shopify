import { redirect } from "next/navigation";
import { getCart, getCartIdFromCookies } from "@/lib/shopify-cart";

export const dynamic = "force-dynamic";

export default async function CheckoutRedirectPage() {
  const cartId = await getCartIdFromCookies();
  if (!cartId) {
    redirect("/cart");
  }

  let checkoutUrl: string | null = null;
  try {
    const cart = await getCart(cartId);
    if (cart && cart.totalQuantity > 0 && cart.checkoutUrl) {
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