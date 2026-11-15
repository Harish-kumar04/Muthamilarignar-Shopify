"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  addToCartClient,
  applyCartDiscountClient,
  fetchCartState,
  removeCartLineClient,
  updateCartLineClient,
  type CartRecommendation,
} from "@/lib/cart-client";
import type { ShopifyCart, ShopifyCartLine } from "@/lib/shopify-cart";
import { isVariantOutOfStock, normalizeQuantityAvailable } from "@/lib/stock";
import { useLanguage } from "@/components/language-provider";
import Sunburst from "@/components/brand/sunburst";
import { CartIcon, CloseIcon } from "@/components/brand/icons";
import Img from "@/components/ui/img";
import PenLoader from "@/components/ui/pen-loader";
import FreeShippingBar from "@/components/cart/free-shipping-bar";
import { toast } from "@/components/toaster";

type PendingLineOp = {
  lineId: string;
  op: "dec" | "inc" | "remove";
};

function formatRupees(cents: number): string {
  const rs = (cents || 0) / 100;
  return `₹${rs.toLocaleString("en-IN", {
    minimumFractionDigits: Number.isInteger(rs) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function MiniCart({
  initialOpen = false,
}: {
  initialOpen?: boolean;
}) {
  const { t, localizeName, localizeSubName } = useLanguage();
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<ShopifyCart | null>(null);
  const [recommendations, setRecommendations] = useState<CartRecommendation[]>([]);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(500);

  const [pendingOp, setPendingOp] = useState<PendingLineOp | null>(null);
  const [addingRecId, setAddingRecId] = useState<string | null>(null);

  const [couponInput, setCouponInput] = useState("");
  const [couponOp, setCouponOp] = useState<"apply" | "remove" | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [redirectingCheckout, setRedirectingCheckout] = useState(false);

  const loadCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCartState();
      setCart(res.cart);
      setFreeShippingThreshold(res.freeShippingThresholdRupees || 500);
      if (Array.isArray(res.recommendations)) {
        setRecommendations(res.recommendations);
      }
      const activeCode = res.cart?.discountCodes?.find((d) => d.applicable)?.code;
      if (activeCode) setCouponInput(activeCode);
    } catch (err: any) {
      setError(
        err?.message ||
          t(
            "சேவையகம் தற்காலிகமாகக் கிடைக்கவில்லை",
            "Store is temporarily unavailable",
          ),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (initialOpen) {
      void loadCart();
    }
  }, [initialOpen, loadCart]);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      void loadCart();
    };
    const handleClose = () => setIsOpen(false);
    const handleCartChanged = () => {
      if (isOpen) void loadCart();
    };

    window.addEventListener("infalette-open-mini-cart", handleOpen);
    window.addEventListener("infalette-close-mini-cart", handleClose);
    window.addEventListener("infalette-cart-changed", handleCartChanged);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("infalette-open-mini-cart", handleOpen);
      window.removeEventListener("infalette-close-mini-cart", handleClose);
      window.removeEventListener("infalette-cart-changed", handleCartChanged);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [loadCart, isOpen]);

  const applyOptimisticCart = (nextLines: ShopifyCartLine[]) => {
    setCart((prev) => {
      if (!prev) return prev;
      const totalQuantity = nextLines.reduce((s, l) => s + l.quantity, 0);
      const subtotalCents = nextLines.reduce((s, l) => s + l.lineTotalCents, 0);
      const totalCents = Math.max(0, subtotalCents - prev.discountCents);
      return {
        ...prev,
        lines: nextLines,
        totalQuantity,
        subtotalCents,
        subtotalRupees: subtotalCents / 100,
        totalCents,
        totalRupees: totalCents / 100,
      };
    });
  };

  const handleStepQty = async (
    line: ShopifyCartLine,
    delta: -1 | 1,
  ) => {
    const targetQty = line.quantity + delta;
    if (targetQty <= 0) {
      await handleRemoveLine(line);
      return;
    }
    const qtyAvail = normalizeQuantityAvailable(line.quantityAvailable);
    if (delta > 0 && qtyAvail !== null && qtyAvail > 0 && targetQty > qtyAvail) {
      return;
    }

    const prevCart = cart;
    setPendingOp({ lineId: line.id, op: delta < 0 ? "dec" : "inc" });
    if (cart) {
      applyOptimisticCart(
        cart.lines.map((l) =>
          l.id === line.id
            ? {
                ...l,
                quantity: targetQty,
                lineTotalCents: l.unitPriceCents * targetQty,
                lineTotalRupees: (l.unitPriceCents * targetQty) / 100,
              }
            : l,
        ),
      );
    }

    try {
      const res = await updateCartLineClient(line.id, targetQty);
      setCart(res.cart);
    } catch (err: any) {
      setCart(prevCart);
      toast({
        kind: "error",
        title: t("எண்ணிக்கையை மாற்ற முடியவில்லை", "Could not update quantity"),
        description: err?.message || t("மீண்டும் முயற்சிக்கவும்", "Please try again"),
      });
    } finally {
      setPendingOp(null);
    }
  };

  const handleRemoveLine = async (line: ShopifyCartLine) => {
    const prevCart = cart;
    setPendingOp({ lineId: line.id, op: "remove" });
    if (cart) {
      applyOptimisticCart(cart.lines.filter((l) => l.id !== line.id));
    }

    try {
      const res = await removeCartLineClient(line.id);
      setCart(res.cart);
    } catch (err: any) {
      setCart(prevCart);
      toast({
        kind: "error",
        title: t("நூலை நீக்க முடியவில்லை", "Could not remove book"),
        description: err?.message || t("மீண்டும் முயற்சிக்கவும்", "Please try again"),
      });
    } finally {
      setPendingOp(null);
    }
  };

  const handleApplyCoupon = async () => {
    const clean = couponInput.trim().toUpperCase();
    if (!clean) {
      setCouponError(t("கூப்பன் குறியீட்டை உள்ளிடவும்", "Enter a coupon code"));
      return;
    }
    setCouponOp("apply");
    setCouponError(null);
    try {
      const res = await applyCartDiscountClient(clean);
      setCart(res.cart);
    } catch (err: any) {
      setCouponError(
        err?.message || t("தவறான கூப்பன் குறியீடு", "Invalid coupon code"),
      );
    } finally {
      setCouponOp(null);
    }
  };

  const handleRemoveCoupon = async () => {
    setCouponOp("remove");
    setCouponError(null);
    try {
      const res = await applyCartDiscountClient("");
      setCart(res.cart);
      setCouponInput("");
    } catch (err: any) {
      setCouponError(
        err?.message || t("கூப்பனை நீக்க முடியவில்லை", "Could not remove coupon"),
      );
    } finally {
      setCouponOp(null);
    }
  };

  const handleAddRecommendation = async (rec: CartRecommendation) => {
    if (addingRecId || isVariantOutOfStock(rec.availableForSale, rec.quantityAvailable)) {
      return;
    }
    setAddingRecId(rec.id);
    try {
      const res = await addToCartClient({
        merchandiseId: rec.variant_id,
        productId: rec.id,
        quantity: 1,
      });
      setCart(res.cart);
      setRecommendations((prev) => prev.filter((r) => r.id !== rec.id));
    } catch (err: any) {
      toast({
        kind: "error",
        title: t("கூடையில் சேர்க்க முடியவில்லை", "Could not add to cart"),
        description: err?.message,
      });
    } finally {
      setAddingRecId(null);
    }
  };

  const handleCheckout = () => {
    if (!cart?.checkoutUrl || cart.lines.length === 0) return;
    setRedirectingCheckout(true);
    window.location.assign(cart.checkoutUrl);
  };

  if (!isOpen) return null;

  const lines = cart?.lines ?? [];
  const appliedCode = cart?.discountCodes?.find((d) => d.applicable) || null;
  const fallbackSubtotalCents = lines.reduce(
    (sum, l) => sum + l.unitPriceCents * l.quantity,
    0,
  );
  const subtotalCents =
    typeof cart?.subtotalCents === "number" ? cart.subtotalCents : fallbackSubtotalCents;
  const discountCents = cart?.discountCents ?? 0;
  const totalCents =
    typeof cart?.totalCents === "number" && (cart.totalCents > 0 || discountCents > 0)
      ? cart.totalCents
      : Math.max(0, subtotalCents - discountCents);
  const hasUnavailableLine = lines.some((l) =>
    isVariantOutOfStock(l.availableForSale, l.quantityAvailable),
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/45 transition-opacity"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-over Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("உங்கள் கூடை", "Shopping cart")}
        className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <CartIcon className="h-5 w-5 text-brand-red" />
            <h2 className="text-[17px] font-bold text-black">
              {t("கூடை", "Cart")}
              {(cart?.totalQuantity ?? 0) > 0 && (
                <span className="ml-2 text-[13px] font-normal text-black/65">
                  ({cart?.totalQuantity} {t("நூல்கள்", "books")})
                </span>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-black/70 transition-colors hover:bg-black/5 hover:text-black"
            aria-label="Close cart"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Free-Shipping Progress Bar */}
        {lines.length > 0 && (
          <div className="border-b border-black/[0.06] px-5 py-3">
            <FreeShippingBar
              subtotalCents={subtotalCents}
              thresholdRupees={freeShippingThreshold}
            />
          </div>
        )}

        {/* Items + Recommendations */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error ? (
            <div className="rounded-2xl border border-brand-red/25 bg-brand-red-light px-4 py-8 text-center text-[13.5px] font-semibold text-brand-red-dark">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => void loadCart()}
                className="btn-red mt-4 h-10 px-5 text-[13px]"
              >
                {t("மீண்டும் முயற்சிக்கவும்", "Try again")}
              </button>
            </div>
          ) : loading && lines.length === 0 ? (
            <div className="flex h-44 flex-col items-center justify-center gap-3 text-sm text-black/70">
              <PenLoader size="md" label={t("கூடை ஏற்றப்படுகிறது", "Loading cart")} />
              <span>{t("கூடை ஏற்றப்படுகிறது…", "Loading cart…")}</span>
            </div>
          ) : lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Sunburst className="h-16 w-32 text-brand-red/15" />
              <p className="mt-4 text-[16px] font-bold text-black">
                {t("கூடை காலியாக உள்ளது", "Your cart is empty")}
              </p>
              <p className="mt-1 text-[13px] text-black/65">
                {t(
                  "நூல்களைத் தேர்வு செய்து கூடையில் சேர்க்கவும்",
                  "Explore our books and add them to your cart",
                )}
              </p>
              <Link
                href="/books"
                onClick={() => setIsOpen(false)}
                className="btn-red mt-5 h-11 px-6 text-[13.5px]"
              >
                {t("நூல்களைக் காண்க", "Browse books")}
              </Link>
            </div>
          ) : (
            <div className="space-y-4 divide-y divide-black/[0.06]">
              {lines.map((line) => {
                const subTitle = localizeSubName(line.title);
                const primaryTitle = localizeName(line.title);
                const hasDistinctSub = Boolean(subTitle && subTitle !== primaryTitle);
                const qtyAvail = normalizeQuantityAvailable(line.quantityAvailable);
                const lineOutOfStock = isVariantOutOfStock(
                  line.availableForSale,
                  qtyAvail,
                );
                const atMaxStock =
                  qtyAvail !== null && qtyAvail > 0 && line.quantity >= qtyAvail;
                const lineTotalCents =
                  typeof line.lineTotalCents === "number" &&
                  Number.isFinite(line.lineTotalCents)
                    ? line.lineTotalCents
                    : line.unitPriceCents * line.quantity;
                const isThisLineBusy = pendingOp?.lineId === line.id;
                const decBusy = isThisLineBusy && pendingOp?.op === "dec";
                const incBusy = isThisLineBusy && pendingOp?.op === "inc";
                const remBusy = isThisLineBusy && pendingOp?.op === "remove";

                return (
                  <div key={line.id} className="flex gap-3.5 pt-4 first:pt-0">
                    <Link
                      href={`/books/${encodeURIComponent(line.slug || line.productId)}`}
                      onClick={() => setIsOpen(false)}
                      className="relative h-24 w-18 flex-shrink-0 overflow-hidden rounded-lg border border-black/[0.08] bg-[#FAFAFA]"
                    >
                      {line.imageUrl ? (
                        <Img
                          src={line.imageUrl}
                          alt={primaryTitle}
                          fill
                          sizes="72px"
                          className="object-contain p-1.5"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-black/55">
                          {t("படம் இல்லை", "No cover")}
                        </div>
                      )}
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/books/${encodeURIComponent(line.slug || line.productId)}`}
                            onClick={() => setIsOpen(false)}
                            className="line-clamp-2 text-[14px] font-bold text-black transition-colors hover:text-brand-red-dark"
                          >
                            {primaryTitle}
                          </Link>
                          {hasDistinctSub && (
                            <p className="line-clamp-1 text-[12px] text-black/65">
                              {subTitle}
                            </p>
                          )}
                          <p className="mt-0.5 text-[12px] text-black/70">
                            {formatRupees(line.unitPriceCents)} {t("/ பிரதி", "each")}
                          </p>
                          {lineOutOfStock && (
                            <p className="mt-0.5 text-[11.5px] font-bold text-brand-red-dark">
                              {t("கையிருப்பில் இல்லை", "Out of stock")}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={isThisLineBusy}
                          onClick={() => handleRemoveLine(line)}
                          className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-[18px] text-black/55 transition-colors hover:bg-black/5 hover:text-brand-red-dark disabled:opacity-50"
                          aria-label={`Remove ${primaryTitle}`}
                        >
                          {remBusy ? (
                            <PenLoader size="sm" label={t("நீக்குகிறது", "Removing")} />
                          ) : (
                            "×"
                          )}
                        </button>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center rounded-full border border-black/20 bg-white text-sm">
                          <button
                            type="button"
                            disabled={isThisLineBusy}
                            onClick={() => handleStepQty(line, -1)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-l-full font-bold text-black transition-colors hover:bg-black/5 disabled:opacity-40"
                            aria-label="Decrease quantity"
                          >
                            {decBusy ? (
                              <PenLoader size="sm" label={t("குறைக்கிறது", "Decreasing")} />
                            ) : (
                              "–"
                            )}
                          </button>
                          <span className="w-8 text-center font-bold text-black">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={atMaxStock || lineOutOfStock || isThisLineBusy}
                            onClick={() => handleStepQty(line, 1)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-r-full font-bold text-black transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Increase quantity"
                          >
                            {incBusy ? (
                              <PenLoader size="sm" label={t("அதிகரிக்கிறது", "Increasing")} />
                            ) : (
                              "+"
                            )}
                          </button>
                        </div>

                        <span className="text-[16px] font-extrabold text-brand-red">
                          {formatRupees(lineTotalCents)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recommendations inside Drawer */}
          {recommendations.length > 0 && !error && (
            <div className="mt-6 border-t border-black/10 pt-5">
              <p className="mb-3 text-[12px] font-extrabold uppercase tracking-wider text-black/65">
                {t("பரிந்துரைக்கப்படும் நூல்கள்", "Recommended Books")}
              </p>
              <div className="space-y-3">
                {recommendations.slice(0, 3).map((rec) => {
                  const recPrice =
                    rec.sale_price_cents && rec.sale_price_cents < rec.price_cents
                      ? rec.sale_price_cents
                      : rec.price_cents;
                  const recOutOfStock = isVariantOutOfStock(
                    rec.availableForSale,
                    rec.quantityAvailable,
                  );
                  const isAddingThis = addingRecId === rec.id;
                  return (
                    <div
                      key={rec.id}
                      className="flex items-center gap-3 rounded-xl border border-black/[0.08] bg-[#FAFAFA] p-2.5"
                    >
                      <Link
                        href={`/books/${encodeURIComponent(rec.slug || rec.id)}`}
                        onClick={() => setIsOpen(false)}
                        className="relative h-14 w-11 flex-shrink-0 overflow-hidden rounded-md border border-black/[0.06] bg-white"
                      >
                        {rec.image_url ? (
                          <Img
                            src={rec.image_url}
                            alt={localizeName(rec.name)}
                            fill
                            sizes="48px"
                            className="object-contain p-1"
                          />
                        ) : null}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/books/${encodeURIComponent(rec.slug || rec.id)}`}
                          onClick={() => setIsOpen(false)}
                          className="line-clamp-1 text-[12.5px] font-bold text-black hover:text-brand-red-dark"
                        >
                          {localizeName(rec.name)}
                        </Link>
                        <p className="text-[12px] font-extrabold text-brand-red">
                          {formatRupees(recPrice)}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={recOutOfStock || Boolean(addingRecId)}
                        onClick={() => handleAddRecommendation(rec)}
                        className="inline-flex h-9 min-w-[68px] items-center justify-center rounded-full border border-black/20 bg-white px-3 text-[11.5px] font-bold text-black hover:border-brand-red-dark hover:text-brand-red-dark disabled:opacity-50"
                      >
                        {isAddingThis ? (
                          <PenLoader size="sm" label={t("சேர்க்கிறது", "Adding")} />
                        ) : (
                          `+ ${t("சேர்", "Add")}`
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Coupon Box & Checkout */}
        {lines.length > 0 && (
          <div className="space-y-3 border-t border-black/10 bg-white p-5">
            {/* Drawer Coupon Box */}
            <div>
              {appliedCode ? (
                <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-3.5 py-2 text-[12.5px]">
                  <div>
                    <span className="font-bold text-green-900">{appliedCode.code}</span>
                    <span className="ml-2 text-green-800">
                      {discountCents > 0
                        ? `−${formatRupees(discountCents)}`
                        : t("கூப்பன் இணைக்கப்பட்டது", "Applied at checkout")}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={couponOp !== null}
                    onClick={handleRemoveCoupon}
                    className="inline-flex min-h-[36px] items-center px-2 font-bold text-brand-red-dark hover:underline disabled:opacity-50"
                  >
                    {couponOp === "remove" ? (
                      <PenLoader size="sm" label={t("நீக்குகிறது", "Removing coupon")} />
                    ) : (
                      t("நீக்கு", "Remove")
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <label htmlFor="minicart-coupon" className="sr-only">
                    {t("கூப்பன் குறியீடு", "Coupon code")}
                  </label>
                  <input
                    id="minicart-coupon"
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value.toUpperCase());
                      if (couponError) setCouponError(null);
                    }}
                    placeholder={t("கூப்பன் குறியீடு", "Coupon code")}
                    className="h-11 flex-1 rounded-full border border-black/20 bg-[#FAFAFA] px-4 text-[13px] uppercase text-black placeholder:normal-case placeholder:text-black/55 focus:border-brand-red focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={couponOp !== null}
                    onClick={handleApplyCoupon}
                    className="inline-flex h-11 min-w-[82px] items-center justify-center rounded-full bg-black px-4 text-[12.5px] font-bold text-white hover:bg-brand-red-dark disabled:opacity-60"
                  >
                    {couponOp === "apply" ? (
                      <PenLoader size="sm" tone="light" label="Applying" />
                    ) : (
                      t("பயன்படுத்து", "Apply")
                    )}
                  </button>
                </div>
              )}
              {couponError && (
                <p className="mt-1 text-[12px] font-semibold text-brand-red-dark">
                  {couponError}
                </p>
              )}
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <span className="text-[14px] font-semibold text-black/80">
                {t("மொத்தத் தொகை", "Subtotal")}
              </span>
              <span className="text-[22px] font-extrabold text-brand-red">
                {formatRupees(discountCents > 0 ? totalCents : subtotalCents)}
              </span>
            </div>
            <p className="text-[11.5px] text-black/65">
              {t(
                "வரி மற்றும் விநியோகக் கட்டணம் அடுத்த பக்கத்தில் கணக்கிடப்படும்",
                "Taxes and shipping calculated at Shopify checkout",
              )}
            </p>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <Link
                href="/cart"
                onClick={() => setIsOpen(false)}
                className="btn-outline h-11 px-3 text-[13px] font-bold"
              >
                {t("கூடையைக் காண்க", "View cart")}
              </Link>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={redirectingCheckout || hasUnavailableLine || !cart?.checkoutUrl}
                aria-busy={redirectingCheckout || undefined}
                className="btn-red h-11 px-3 text-[13.5px] font-bold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {redirectingCheckout ? (
                  <PenLoader size="sm" tone="light" label={t("தொடர்கிறது", "Redirecting")} />
                ) : (
                  t("பணம் செலுத்த", "Checkout")
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
