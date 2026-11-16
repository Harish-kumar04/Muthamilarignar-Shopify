"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "@/components/ui/img";
import PenLoader from "@/components/ui/pen-loader";
import ProductCard, { toCardProduct } from "@/components/product/product-card";
import { SectionHeading } from "@/components/brand/patterns";
import { toast } from "@/components/toaster";
import { useLanguage } from "@/components/language-provider";
import {
  applyCartDiscountClient,
  fetchCartState,
  removeCartLineClient,
  updateCartLineClient,
  type CartRecommendation,
} from "@/lib/cart-client";
import type { ShopifyCart, ShopifyCartLine } from "@/lib/shopify-cart";
import { isVariantOutOfStock, normalizeQuantityAvailable } from "@/lib/stock";

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

export default function CartPage() {
  const { t, localizeName, localizeSubName } = useLanguage();
  const [cart, setCart] = useState<ShopifyCart | null>(null);
  const [recommendations, setRecommendations] = useState<CartRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pendingOp, setPendingOp] = useState<PendingLineOp | null>(null);
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
      if (Array.isArray(res.recommendations)) {
        setRecommendations(res.recommendations);
      }
      const activeCode = res.cart?.discountCodes?.find((d) => d.applicable)?.code;
      if (activeCode) setCouponInput(activeCode);
    } catch (e: any) {
      setError(
        e?.message ||
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
    void loadCart();
    const onChanged = () => void loadCart();
    window.addEventListener("infalette-cart-changed", onChanged);
    return () => window.removeEventListener("infalette-cart-changed", onChanged);
  }, [loadCart]);

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

  const handleStepQty = async (line: ShopifyCartLine, delta: -1 | 1) => {
    const nextQty = line.quantity + delta;
    if (nextQty <= 0) {
      await handleRemoveLine(line);
      return;
    }
    const qtyAvail = normalizeQuantityAvailable(line.quantityAvailable);
    if (delta > 0 && qtyAvail !== null && qtyAvail > 0 && nextQty > qtyAvail) {
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
                quantity: nextQty,
                lineTotalCents: l.unitPriceCents * nextQty,
                lineTotalRupees: (l.unitPriceCents * nextQty) / 100,
              }
            : l,
        ),
      );
    }

    try {
      const res = await updateCartLineClient(line.id, nextQty);
      setCart(res.cart);
    } catch (e: any) {
      setCart(prevCart);
      toast({
        kind: "error",
        title: t("எண்ணிக்கையை மாற்ற முடியவில்லை", "Could not update quantity"),
        description: e?.message,
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
    } catch (e: any) {
      setCart(prevCart);
      toast({
        kind: "error",
        title: t("நூலை நீக்க முடியவில்லை", "Could not remove book"),
        description: e?.message,
      });
    } finally {
      setPendingOp(null);
    }
  };

  const handleApplyCoupon = async () => {
    const clean = couponInput.trim().toUpperCase();
    if (!clean) {
      setCouponError(t("கூப்பன் குறியீட்டை உள்ளிடவும்", "Please enter a coupon code"));
      return;
    }
    setCouponOp("apply");
    setCouponError(null);
    try {
      const res = await applyCartDiscountClient(clean);
      setCart(res.cart);
    } catch (e: any) {
      setCouponError(e?.message || t("தவறான கூப்பன்", "Invalid coupon code"));
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
    } catch (e: any) {
      setCouponError(
        e?.message || t("கூப்பனை நீக்க முடியவில்லை", "Could not remove coupon"),
      );
    } finally {
      setCouponOp(null);
    }
  };

  const handleCheckout = () => {
    if (!cart?.checkoutUrl || cart.lines.length === 0) return;
    setRedirectingCheckout(true);
    window.location.assign(cart.checkoutUrl);
  };

  const lines = cart?.lines ?? [];
  const isInitialLoading = loading && lines.length === 0;
  const isEmpty = !isInitialLoading && lines.length === 0;
  const itemCount =
    cart?.totalQuantity ?? lines.reduce((sum, l) => sum + l.quantity, 0);
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
  const appliedCode = cart?.discountCodes?.find((d) => d.applicable) || null;
  const hasUnavailableLine = lines.some((l) =>
    isVariantOutOfStock(l.availableForSale, l.quantityAvailable),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <p className="eyebrow">{t("உங்கள் புத்தகக் கூடை", "Your Book Cart")}</p>
        <h1 className="mt-2 text-[32px] font-extrabold tracking-tight text-black sm:text-[42px]">
          {isInitialLoading
            ? t("உங்கள் புத்தகக் கூடை", "Your Book Cart")
            : isEmpty
              ? t("உங்கள் கூடை காலியாக உள்ளது.", "Your cart is empty.")
              : t(
                  `கூடை — ${itemCount} நூல்கள்`,
                  `Cart — ${itemCount} book${itemCount === 1 ? "" : "s"}`,
                )}
        </h1>
        <div aria-hidden="true" className="mt-3 h-1 w-14 rounded-full bg-brand-red" />
        {!isInitialLoading && !isEmpty && (
          <p className="mt-3 text-[15px] text-black/70">
            {t(
              "ஆர்டரை உறுதி செய்யும் முன் தேர்ந்தெடுத்த நூல்களைச் சரிபார்க்கவும்.",
              "Review your selected books before proceeding to Shopify checkout.",
            )}
          </p>
        )}
      </header>

      {error ? (
        <div className="rounded-2xl border border-brand-red/25 bg-brand-red-light px-6 py-16 text-center">
          <p className="text-[15px] font-bold text-brand-red-dark">{error}</p>
          <button
            type="button"
            onClick={() => void loadCart()}
            className="btn-red mt-5 h-11 px-6 text-[14px]"
          >
            {t("மீண்டும் முயற்சிக்கவும்", "Try again")}
          </button>
        </div>
      ) : isInitialLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/15 bg-[#FAFAFA] px-6 py-20 text-center text-[15px] text-black/70">
          <PenLoader size="lg" label={t("உங்கள் கூடை ஏற்றப்படுகிறது", "Loading your cart")} />
          <span>{t("உங்கள் கூடை ஏற்றப்படுகிறது…", "Loading your cart…")}</span>
        </div>
      ) : isEmpty ? (
        <div className="rounded-2xl border border-dashed border-black/20 bg-[#FAFAFA] px-6 py-20 text-center">
          <p className="text-[15.5px] font-medium text-black/75">
            {t(
              "நீங்கள் தேர்ந்தெடுக்கும் நூல்கள் இங்கே தோன்றும்.",
              "Once you add books, they'll appear here.",
            )}
          </p>
          <Link href="/books" className="btn-red mt-6 h-12 px-7 text-[14.5px]">
            {t("நூல்களைப் பார்வையிடுக", "Browse Books")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Items */}
          <div className="lg:col-span-2">
            <div className="divide-y divide-black/[0.08] rounded-2xl border border-black/[0.08] bg-white px-5 shadow-card">
              {lines.map((line) => {
                const primaryTitle = localizeName(line.title);
                const subTitle = localizeSubName(line.title);
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
                const bookHref = `/books/${encodeURIComponent(line.slug || line.productId)}`;
                const isThisLineBusy = pendingOp?.lineId === line.id;
                const decBusy = isThisLineBusy && pendingOp?.op === "dec";
                const incBusy = isThisLineBusy && pendingOp?.op === "inc";
                const remBusy = isThisLineBusy && pendingOp?.op === "remove";

                return (
                  <div key={line.id} className="flex gap-4 py-6">
                    <Link
                      href={bookHref}
                      className="relative h-28 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-black/[0.08] bg-[#FAFAFA] sm:h-32 sm:w-24"
                    >
                      {line.imageUrl ? (
                        <Image
                          src={line.imageUrl}
                          alt={primaryTitle}
                          fill
                          sizes="96px"
                          className="object-contain p-1.5"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-black/55">
                          {t("படம் இல்லை", "No cover")}
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={bookHref}
                        className="block text-[15.5px] font-bold text-black hover:text-brand-red-dark hover:underline"
                      >
                        {primaryTitle}
                      </Link>
                      {hasDistinctSub && (
                        <p className="mt-0.5 text-[13px] font-medium text-black/65">
                          {subTitle}
                        </p>
                      )}
                      {line.author && (
                        <p className="mt-0.5 text-[12px] text-black/60">{line.author}</p>
                      )}
                      <p className="mt-1 text-[13px] text-black/70">
                        {formatRupees(line.unitPriceCents)} {t("/ பிரதி", "each")}
                        {line.compareAtUnitPriceCents &&
                          line.compareAtUnitPriceCents > line.unitPriceCents && (
                            <span className="ml-2 text-[12px] text-black/50 line-through">
                              {formatRupees(line.compareAtUnitPriceCents)}
                            </span>
                          )}
                      </p>

                      {lineOutOfStock && (
                        <p className="mt-1 text-[12.5px] font-bold text-brand-red-dark">
                          {t(
                            "தற்போது கையிருப்பில் இல்லை — தொடர நீக்கவும்",
                            "Currently out of stock — remove to proceed",
                          )}
                        </p>
                      )}

                      {/* >=44px Quantity Stepper + Remove (PenLoader on affected control only) */}
                      <div className="mt-3 flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center rounded-full border border-black/20 bg-white">
                          <button
                            type="button"
                            disabled={isThisLineBusy}
                            onClick={() => handleStepQty(line, -1)}
                            aria-label="Decrease quantity"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-l-full text-sm font-bold text-black hover:bg-black/5 disabled:opacity-40"
                          >
                            {decBusy ? (
                              <PenLoader size="sm" label={t("குறைக்கிறது", "Decreasing")} />
                            ) : (
                              "−"
                            )}
                          </button>
                          <span className="w-8 text-center text-[14.5px] font-bold text-black">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={isThisLineBusy || atMaxStock || lineOutOfStock}
                            onClick={() => handleStepQty(line, 1)}
                            aria-label="Increase quantity"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-r-full text-sm font-bold text-black hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {incBusy ? (
                              <PenLoader size="sm" label={t("அதிகரிக்கிறது", "Increasing")} />
                            ) : (
                              "+"
                            )}
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={isThisLineBusy}
                          onClick={() => handleRemoveLine(line)}
                          className="inline-flex min-h-[44px] min-w-[74px] items-center justify-center px-3 text-[13px] font-semibold text-black/70 hover:text-brand-red-dark hover:underline disabled:opacity-50"
                        >
                          {remBusy ? (
                            <PenLoader size="sm" label={t("நீக்குகிறது", "Removing")} />
                          ) : (
                            t("நீக்குக", "Remove")
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="whitespace-nowrap text-[18px] font-extrabold text-brand-red">
                      {formatRupees(lineTotalCents)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <aside className="h-fit rounded-2xl border border-black/10 bg-[#FAFAFA] p-6 shadow-card lg:sticky lg:top-24">
            <h2 className="text-[17px] font-extrabold text-black">
              {t("ஆர்டர் சுருக்கம்", "Order Summary")}
            </h2>

            {/* Coupon Box */}
            <div className="mt-4 border-b border-black/10 pb-4">
              <label
                htmlFor="cart-coupon-input"
                className="mb-1.5 block text-[12.5px] font-bold text-black/80"
              >
                {t("தள்ளுபடி கூப்பன்", "Coupon Code")}
              </label>
              {appliedCode ? (
                <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-3.5 py-2.5 text-[13px]">
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
                    className="inline-flex min-h-[36px] items-center px-2 text-[12.5px] font-bold text-brand-red-dark hover:underline disabled:opacity-50"
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
                  <input
                    id="cart-coupon-input"
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value.toUpperCase());
                      if (couponError) setCouponError(null);
                    }}
                    placeholder={t("குறியீடு (எ.கா. SAVE10)", "Enter coupon code")}
                    className="h-11 flex-1 rounded-full border border-black/20 bg-white px-4 text-[13px] uppercase text-black placeholder:normal-case placeholder:text-black/55 focus:border-brand-red focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={couponOp !== null}
                    onClick={handleApplyCoupon}
                    className="inline-flex h-11 min-w-[88px] items-center justify-center rounded-full bg-black px-5 text-[13px] font-bold text-white hover:bg-brand-red-dark disabled:opacity-50"
                  >
                    {couponOp === "apply" ? (
                      <PenLoader
                        size="sm"
                        tone="light"
                        label={t("சரிபார்க்கப்படுகிறது", "Applying coupon")}
                      />
                    ) : (
                      t("பயன்படுத்து", "Apply")
                    )}
                  </button>
                </div>
              )}
              {couponError && (
                <p className="mt-1.5 text-[12.5px] font-semibold text-brand-red-dark">
                  {couponError}
                </p>
              )}
            </div>

            <div className="mt-4 space-y-2.5 text-[14px]">
              <div className="flex justify-between text-black/75">
                <span>{t("நூல்களின் விலை", "Subtotal")}</span>
                <span className="font-semibold text-black">
                  {formatRupees(subtotalCents)}
                </span>
              </div>
              {discountCents > 0 && (
                <div className="flex justify-between font-semibold text-green-800">
                  <span>
                    {t("தள்ளுபடி", "Discount")}
                    {appliedCode ? ` (${appliedCode.code})` : ""}
                  </span>
                  <span>−{formatRupees(discountCents)}</span>
                </div>
              )}
              <div className="flex justify-between text-black/75">
                <span>{t("அஞ்சல் / கூரியர் கட்டணம்", "Shipping")}</span>
                <span className="font-semibold text-black/75">
                  {t("அடுத்த பக்கத்தில்", "Calculated at checkout")}
                </span>
              </div>
            </div>

            <div className="mt-4 flex justify-between border-t border-black/10 pt-4 text-[18px] font-extrabold text-black">
              <span>{t("மொத்தத் தொகை", "Total")}</span>
              <span className="text-brand-red">{formatRupees(totalCents)}</span>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={redirectingCheckout || hasUnavailableLine || !cart?.checkoutUrl}
              aria-busy={redirectingCheckout || undefined}
              className="btn-red mt-6 h-12 w-full text-[14.5px] font-bold shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
            >
              {redirectingCheckout ? (
                <PenLoader
                  size="sm"
                  tone="light"
                  label={t("செலுத்தும் பக்கத்திற்குத் தொடர்கிறது", "Redirecting to checkout")}
                />
              ) : (
                t("ஆர்டர் செய்யத் தொடர்க →", "Checkout →")
              )}
            </button>

            <Link
              href="/books"
              className="btn-outline mt-3 h-11 w-full text-[14px] font-semibold"
            >
              {t("மேலும் நூல்களைத் தேர்ந்தெடுக்க", "Continue Shopping")}
            </Link>
            <p className="mt-4 text-center text-[12px] text-black/70">
              {t(
                "Shopify பாதுகாப்பான கட்டணப் பக்கம் · ஆன்லைன் அல்லது COD வசதி.",
                "Secure Shopify checkout · Online payment or COD.",
              )}
            </p>
          </aside>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="mt-16 border-t border-black/[0.08] pt-12">
          <div className="mb-8">
            <SectionHeading
              eyebrow={{ ta: "பரிந்துரைகள்", en: "Recommended for You" }}
              title={{
                ta: "நீங்கள் விரும்பக்கூடிய பிற நூல்கள்",
                en: "More Titles Readers Love",
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {recommendations.map((rec) => (
              <ProductCard key={rec.id} product={toCardProduct(rec)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}