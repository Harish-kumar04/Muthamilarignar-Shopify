"use client";

import { useState } from "react";
import {
  addToCartClient,
  buyNowClient,
  isShopifyCatalogId,
} from "@/lib/cart-client";
import { openMiniCart, optimisticAdjustCart } from "@/lib/cart-events";
import { isVariantOutOfStock, normalizeQuantityAvailable } from "@/lib/stock";
import { toast } from "@/components/toaster";
import { useLanguage } from "@/components/language-provider";
import { CartIcon } from "@/components/brand/icons";
import PenLoader from "@/components/ui/pen-loader";

export default function CardAddButton({
  productId,
  variantId = null,
  productName,
  unitPriceCents = 0,
  inStock = true,
  availableForSale = true,
  quantityAvailable = null,
  isFallback = false,
}: {
  productId: string;
  variantId?: string | null;
  productName: string;
  unitPriceCents?: number;
  inStock?: boolean;
  availableForSale?: boolean;
  quantityAvailable?: number | null;
  isFallback?: boolean;
}) {
  const { t, localizeName } = useLanguage();
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);
  const [success, setSuccess] = useState(false);

  const qtyAvail = normalizeQuantityAvailable(quantityAvailable);
  const canPurchase =
    inStock !== false && !isVariantOutOfStock(availableForSale, qtyAvail);
  const unavailable = Boolean(isFallback) || !isShopifyCatalogId(variantId || productId);

  if (!canPurchase) {
    return (
      <div className="mt-3 grid grid-cols-1 gap-2">
        <button
          type="button"
          disabled
          className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center rounded-full border border-black/10 bg-black/[0.04] px-3 text-[12.5px] font-semibold text-black/50"
        >
          {t("கையிருப்பில் இல்லை", "Out of stock")}
        </button>
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className="mt-3">
        <button
          type="button"
          disabled
          title="Store is temporarily unavailable"
          className="inline-flex min-h-[44px] w-full cursor-not-allowed items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-center text-[11.5px] font-semibold leading-snug text-amber-900"
        >
          {t(
            "சேவையகம் தற்காலிகமாகக் கிடைக்கவில்லை",
            "Store is temporarily unavailable",
          )}
        </button>
      </div>
    );
  }

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding || buying || !canPurchase || unavailable) return;

    const rollback = optimisticAdjustCart(1, unitPriceCents);
    setAdding(true);
    setSuccess(false);
    try {
      await addToCartClient({
        merchandiseId: variantId,
        productId,
        quantity: 1,
      });
      setSuccess(true);
      openMiniCart();
      toast({
        kind: "success",
        title: t("கூடையில் சேர்க்கப்பட்டது", "Added to cart"),
        description: localizeName(productName),
      });
      setTimeout(() => setSuccess(false), 1600);
    } catch (err: any) {
      rollback();
      setSuccess(false);
      toast({
        kind: "error",
        title: t("கூடையில் சேர்க்க முடியவில்லை", "Could not add to cart"),
        description:
          err?.message ||
          t(
            "சேவையகம் தற்காலிகமாகக் கிடைக்கவில்லை",
            "Store is temporarily unavailable",
          ),
      });
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding || buying || !canPurchase || unavailable) return;

    setBuying(true);
    try {
      const { checkoutUrl } = await buyNowClient({
        merchandiseId: variantId,
        productId,
        quantity: 1,
      });
      window.location.assign(checkoutUrl);
    } catch (err: any) {
      setBuying(false);
      toast({
        kind: "error",
        title: t("ஆர்டர் பக்கத்தைத் திறக்க முடியவில்லை", "Could not start checkout"),
        description:
          err?.message ||
          t(
            "சேவையகம் தற்காலிகமாகக் கிடைக்கவில்லை",
            "Store is temporarily unavailable",
          ),
      });
    }
  };

  return (
    <div className="mt-3 grid grid-cols-1 gap-2">
      <button
        type="button"
        onClick={handleAdd}
        disabled={adding || buying || !canPurchase}
        aria-busy={adding || undefined}
        aria-label={`${t("கூடையில் சேர்", "Add to cart")} — ${localizeName(productName)}`}
        className={`inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full px-3 text-[12.5px] font-bold transition-colors ${
          success && !adding
            ? "bg-green-700 text-white"
            : "border border-black/20 bg-white text-black hover:border-brand-red-dark hover:text-brand-red-dark disabled:opacity-60"
        }`}
      >
        {adding ? (
          <PenLoader size="sm" label={t("சேர்க்கிறது", "Adding")} />
        ) : success ? (
          <span>✓ {t("சேர்க்கப்பட்டது", "Added to cart")}</span>
        ) : (
          <>
            <CartIcon className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{t("கூடையில் சேர்", "Add to cart")}</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handleBuyNow}
        disabled={adding || buying || !canPurchase}
        aria-busy={buying || undefined}
        aria-label={`${t("இப்போதே வாங்கு", "Buy now")} — ${localizeName(productName)}`}
        className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-black px-3 text-[12.5px] font-bold text-white transition-colors hover:bg-[#D11D1A] disabled:opacity-60"
      >
        {buying ? (
          <PenLoader size="sm" tone="light" label={t("வாங்குகிறது", "Redirecting to checkout")} />
        ) : (
          <span className="truncate">{t("இப்போதே வாங்கு", "Buy now")}</span>
        )}
      </button>
    </div>
  );
}
