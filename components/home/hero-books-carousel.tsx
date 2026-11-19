"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type TouchEvent,
} from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/brand/icons";
import { HeroRedArch } from "@/components/brand/patterns";
import { BiName, T } from "@/components/i18n/t";
import type { CardProduct } from "@/components/product/product-card";
import Img from "@/components/ui/img";
import {
  getCarouselSlot,
  getTruthfulDiscountPct,
  nextSlideIndex,
  normalizeSlideIndex,
  prevSlideIndex,
  type CarouselSlot,
} from "@/lib/hero-book-carousel";
import { splitBilingual } from "@/lib/i18n";

const AUTOPLAY_MS = 4000;
const SWIPE_THRESHOLD_PX = 34;
const DRAG_CLICK_GUARD_PX = 10;

function formatRupees(cents: number): string {
  return `₹${Math.round(cents / 100).toLocaleString("en-IN")}`;
}

function getSlotStyle(slot: CarouselSlot, reducedMotion: boolean): {
  transform: string;
  opacity: number;
  zIndex: number;
} {
  if (reducedMotion) {
    return slot === "front"
      ? { transform: "none", opacity: 1, zIndex: 20 }
      : { transform: "none", opacity: 0, zIndex: 1 };
  }

  switch (slot) {
    case "front":
      return {
        transform: "translate3d(0%, 0%, 0px) scale(1) rotateY(0deg)",
        opacity: 1,
        zIndex: 20,
      };
    case "prev":
      return {
        transform: "translate3d(-62%, 5%, -72px) scale(0.85) rotateY(12deg)",
        opacity: 0.6,
        zIndex: 10,
      };
    case "next":
      return {
        transform: "translate3d(62%, 5%, -72px) scale(0.85) rotateY(-12deg)",
        opacity: 0.6,
        zIndex: 10,
      };
    default:
      return {
        transform: "translate3d(0%, 8%, -140px) scale(0.76) rotateY(0deg)",
        opacity: 0,
        zIndex: 1,
      };
  }
}

export default function HeroBooksCarousel({
  books,
  apiUnavailable = false,
}: {
  books: CardProduct[];
  apiUnavailable?: boolean;
}) {
  const count = books.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const gestureRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    pointerId: number | null;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    pointerId: null,
  });
  const didDragRef = useRef(false);
  const dragResetTimerRef = useRef<number | undefined>(undefined);

  const safeIndex = normalizeSlideIndex(activeIndex, count);
  const activeBook = books[safeIndex] || null;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(mq.matches);
    syncMotion();
    mq.addEventListener?.("change", syncMotion);
    return () => mq.removeEventListener?.("change", syncMotion);
  }, []);

  useEffect(() => {
    const syncVisibility = () => {
      setPageHidden(document.visibilityState !== "visible" || document.hidden);
    };
    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);
    return () => document.removeEventListener("visibilitychange", syncVisibility);
  }, []);

  useEffect(() => {
    return () => {
      if (dragResetTimerRef.current !== undefined) {
        window.clearTimeout(dragResetTimerRef.current);
      }
    };
  }, []);

  const goNext = useCallback(() => {
    setActiveIndex((curr) => nextSlideIndex(curr, count));
  }, [count]);

  const goPrev = useCallback(() => {
    setActiveIndex((curr) => prevSlideIndex(curr, count));
  }, [count]);

  const goTo = useCallback(
    (target: number) => {
      setActiveIndex(normalizeSlideIndex(target, count));
    },
    [count],
  );

  const isPaused = hovered || focused || touched || pageHidden || reducedMotion;

  useEffect(() => {
    if (isPaused || count < 2) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible" && !document.hidden) {
        setActiveIndex((curr) => nextSlideIndex(curr, count));
      }
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [isPaused, count]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (count < 2) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    }
  };

  const markDidDragBriefly = () => {
    didDragRef.current = true;
    if (dragResetTimerRef.current !== undefined) {
      window.clearTimeout(dragResetTimerRef.current);
    }
    dragResetTimerRef.current = window.setTimeout(() => {
      didDragRef.current = false;
    }, 250);
  };

  const finishSwipe = (endX: number, endY: number) => {
    if (!gestureRef.current.active) return;
    const dx = endX - gestureRef.current.startX;
    const dy = endY - gestureRef.current.startY;
    gestureRef.current.active = false;
    gestureRef.current.pointerId = null;

    if (Math.abs(dx) >= DRAG_CLICK_GUARD_PX && Math.abs(dx) > Math.abs(dy)) {
      markDidDragBriefly();
    }

    if (
      count >= 2 &&
      Math.abs(dx) >= SWIPE_THRESHOLD_PX &&
      Math.abs(dx) > Math.abs(dy) * 1.15
    ) {
      if (dx < 0) {
        goNext();
      } else {
        goPrev();
      }
    }
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setTouched(true);
    const t = e.touches[0];
    if (!t) return;
    gestureRef.current = {
      active: true,
      startX: t.clientX,
      startY: t.clientY,
      pointerId: null,
    };
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    const t = e.changedTouches[0];
    if (t) {
      finishSwipe(t.clientX, t.clientY);
    } else {
      gestureRef.current.active = false;
    }
    setTouched(false);
  };

  const handleTouchCancel = () => {
    gestureRef.current.active = false;
    setTouched(false);
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    if (e.button !== 0) return;
    gestureRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      pointerId: e.pointerId,
    };
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    finishSwipe(e.clientX, e.clientY);
  };

  const handlePointerCancel = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    gestureRef.current.active = false;
    gestureRef.current.pointerId = null;
  };

  if (count === 0 || !activeBook) {
    return (
      <div className="relative mx-auto w-full max-w-[460px] lg:max-w-[520px]">
        <div className="relative flex aspect-[10/8.8] w-full items-center justify-center px-2 pt-6 sm:aspect-[10/8.4]">
          <HeroRedArch className="absolute inset-x-0 bottom-0 mx-auto h-[84%] w-full max-w-[460px]" />
          <div className="relative z-10 flex h-56 w-52 items-center justify-center rounded-2xl border-2 border-white bg-[#F4F4F5] p-4 text-center text-sm font-bold text-black/70 shadow-xl">
            {apiUnavailable ? (
              <T
                ta="சேவையகம் தற்காலிகமாகக் கிடைக்கவில்லை"
                en="Store is temporarily unavailable"
              />
            ) : (
              <T ta="படம் இல்லை" en="No cover" />
            )}
          </div>
        </div>
      </div>
    );
  }

  const activeHref = `/books/${encodeURIComponent(activeBook.slug || activeBook.id)}`;
  const activeDiscountPct = getTruthfulDiscountPct(
    activeBook.price_cents,
    activeBook.sale_price_cents,
  );

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="சிறப்பு நூல்கள் / Featured books"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={(e) => {
        setHovered(false);
        if (gestureRef.current.active) {
          finishSwipe(e.clientX, e.clientY);
        }
      }}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setFocused(false);
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onKeyDown={handleKeyDown}
      className="relative mx-auto w-full max-w-[440px] select-none touch-pan-y sm:max-w-[480px] lg:max-w-[520px]"
    >
      {/* Fixed aspect-ratio stage reserves space upfront (zero CLS) */}
      <div className="relative aspect-[10/8.7] w-full sm:aspect-[10/8.3]">
        {/* Stationary faint red sunrise halo behind stage */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-4 bottom-2 top-3 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 60%, rgba(229, 35, 32, 0.24) 0%, rgba(229, 35, 32, 0.09) 42%, rgba(229, 35, 32, 0) 72%)",
          }}
        />

        {/* Revolutionary Red Arch Backdrop (stationary) */}
        <HeroRedArch className="absolute inset-x-0 bottom-1 mx-auto h-[83%] w-full max-w-[450px]" />

        {/* Floating Chip 1 (Top-Left): Best Seller — updates & cross-fades with front book */}
        <Link
          href={activeHref}
          prefetch={false}
          onClick={(e) => {
            if (didDragRef.current) e.preventDefault();
          }}
          className="hero-carousel-fade absolute left-0 top-1 z-30 flex min-h-[44px] max-w-[208px] items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 shadow-lg transition-[transform,opacity] duration-300 hover:-translate-y-0.5 sm:left-2 sm:top-3 sm:max-w-[232px] sm:px-3.5 sm:py-2.5"
        >
          <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#D11D1A] text-white">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-brand-red-dark">
              <T ta="சிறந்த வெளியீடு" en="Best Seller" />
            </p>
            <div className="grid grid-cols-1 grid-rows-1">
              {books.map((book, idx) => {
                const isActive = idx === safeIndex;
                return (
                  <p
                    key={book.id}
                    aria-hidden={isActive ? undefined : true}
                    className={`hero-carousel-fade col-start-1 row-start-1 truncate text-[12px] font-bold text-black transition-[transform,opacity] duration-300 ease-out ${
                      isActive
                        ? "translate-y-0 opacity-100"
                        : "pointer-events-none translate-y-1 opacity-0"
                    }`}
                  >
                    <BiName value={book.name} />
                  </p>
                );
              })}
            </div>
          </div>
        </Link>

        {/* Floating Chip 2 (Bottom-Right): Truthful Discount Chip ONLY when current front book is discounted */}
        <div
          aria-hidden={activeDiscountPct > 0 ? undefined : true}
          className={`hero-carousel-fade pointer-events-none absolute bottom-2 right-1 z-30 flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3.5 py-1.5 shadow-lg transition-[transform,opacity] duration-300 ease-out sm:right-3 sm:px-4 sm:py-2 ${
            activeDiscountPct > 0
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-1 scale-95 opacity-0"
          }`}
        >
          <span
            aria-hidden="true"
            className="inline-block h-2 w-2 rounded-full bg-brand-red"
          />
          <div className="grid grid-cols-1 grid-rows-1 text-[12px] font-extrabold text-black">
            {books.map((book, idx) => {
              const pct = getTruthfulDiscountPct(book.price_cents, book.sale_price_cents);
              const showLayer = idx === safeIndex && pct > 0;
              if (pct <= 0) return null;
              return (
                <span
                  key={book.id}
                  aria-hidden={showLayer ? undefined : true}
                  className={`hero-carousel-fade col-start-1 row-start-1 whitespace-nowrap transition-[transform,opacity] duration-300 ease-out ${
                    showLayer ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <T ta={`${pct}% வரை சலுகை`} en={`Up to ${pct}% OFF`} />
                </span>
              );
            })}
          </div>
        </div>

        {/* 3D Coverflow / Stacked-Deck Stage */}
        <div
          className="relative z-10 flex h-full w-full items-end justify-center pb-5 pt-10 sm:pb-6 sm:pt-12"
          style={{
            perspective: reducedMotion ? undefined : "1100px",
          }}
        >
          <div
            className="relative aspect-[3/4] w-[148px] sm:w-[192px] lg:w-[208px]"
            style={{
              transformStyle: reducedMotion ? undefined : "preserve-3d",
            }}
          >
            {books.map((book, idx) => {
              const slot = getCarouselSlot(idx, safeIndex, count);
              const isFront = slot === "front";
              const isPeek = slot === "prev" || slot === "next";
              const slotStyle = getSlotStyle(slot, reducedMotion);
              const alt = splitBilingual(book.name, "|").join(" — ");
              const bookHref = `/books/${encodeURIComponent(book.slug || book.id)}`;

              const handleCardClick = (e: MouseEvent<HTMLAnchorElement>) => {
                if (didDragRef.current) {
                  e.preventDefault();
                  return;
                }
                if (!isFront) {
                  e.preventDefault();
                  if (isPeek) {
                    goTo(idx);
                  }
                }
              };

              return (
                <div
                  key={book.id}
                  aria-hidden={isFront ? undefined : true}
                  className={`hero-carousel-fade absolute inset-0 will-change-[transform,opacity] ${
                    isFront || isPeek ? "pointer-events-auto" : "pointer-events-none"
                  }`}
                  style={{
                    transform: slotStyle.transform,
                    opacity: slotStyle.opacity,
                    zIndex: slotStyle.zIndex,
                    transition: reducedMotion
                      ? "opacity 180ms ease-out"
                      : "transform 620ms cubic-bezier(0.22, 1, 0.36, 1), opacity 480ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  {/* Gentle 2-3px GPU idle float on active front book */}
                  <div
                    className={
                      isFront && !reducedMotion
                        ? "hero-book-float relative h-full w-full"
                        : "relative h-full w-full"
                    }
                  >
                    {/* Soft ambient drop shadow following the front book */}
                    <div
                      aria-hidden="true"
                      className={`hero-carousel-fade pointer-events-none absolute -bottom-3 inset-x-3 h-6 rounded-full bg-black/35 blur-md transition-opacity duration-500 ${
                        isFront ? "opacity-90" : "opacity-25"
                      }`}
                    />

                    <Link
                      href={bookHref}
                      prefetch={false}
                      tabIndex={isFront ? 0 : -1}
                      aria-label={isFront ? alt : undefined}
                      onClick={handleCardClick}
                      draggable={false}
                      className={`relative block h-full w-full overflow-hidden rounded-xl border-2 border-white bg-[#F4F4F5] shadow-[0_20px_44px_-12px_rgba(0,0,0,0.38),0_6px_18px_-6px_rgba(229,35,32,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 ${
                        isPeek ? "cursor-pointer" : ""
                      }`}
                    >
                      {book.image_url ? (
                        <Img
                          src={book.image_url}
                          alt={alt}
                          fill
                          priority={idx === 0}
                          sizes="(max-width: 640px) 156px, (max-width: 1024px) 200px, 216px"
                          draggable={false}
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-2.5 text-center">
                          <span className="line-clamp-3 text-[11px] font-bold leading-tight text-black/80 sm:text-[12.5px]">
                            <BiName value={book.name} />
                          </span>
                          <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[10px] font-medium text-black/55">
                            <T ta="படம் இல்லை" en="No cover" />
                          </span>
                        </div>
                      )}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Prev / Next Arrow Controls */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="முந்தைய நூல் / Previous book"
              className="absolute left-0 top-1/2 z-30 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/95 text-black shadow-md transition-[transform,opacity] duration-200 hover:scale-105 hover:border-brand-red hover:text-brand-red active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red sm:left-1"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="அடுத்த நூல் / Next book"
              className="absolute right-0 top-1/2 z-30 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/95 text-black shadow-md transition-[transform,opacity] duration-200 hover:scale-105 hover:border-brand-red hover:text-brand-red active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red sm:right-1"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Cross-fading Active Book Title + Live Price Caption & Dot Indicators */}
      <div className="mt-2 flex flex-col items-center">
        <div
          aria-live="polite"
          aria-atomic="true"
          className="grid w-full max-w-[360px] grid-cols-1 grid-rows-1 text-center sm:max-w-[400px]"
        >
          {books.map((book, idx) => {
            const isActive = idx === safeIndex;
            const discountPct = getTruthfulDiscountPct(
              book.price_cents,
              book.sale_price_cents,
            );
            const sellingPriceCents =
              discountPct > 0 && book.sale_price_cents
                ? book.sale_price_cents
                : book.price_cents;
            const href = `/books/${encodeURIComponent(book.slug || book.id)}`;

            return (
              <Link
                key={book.id}
                href={href}
                prefetch={false}
                tabIndex={isActive ? 0 : -1}
                aria-hidden={isActive ? undefined : true}
                onClick={(e) => {
                  if (didDragRef.current) e.preventDefault();
                }}
                className={`hero-carousel-fade col-start-1 row-start-1 flex min-h-[48px] flex-col items-center justify-center rounded-xl px-3 py-1 transition-[transform,opacity] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red ${
                  isActive
                    ? "z-10 translate-y-0 opacity-100"
                    : "pointer-events-none z-0 translate-y-1 opacity-0"
                }`}
              >
                <span className="line-clamp-1 max-w-full text-[14px] font-bold text-black hover:text-brand-red sm:text-[15px]">
                  <BiName value={book.name} />
                </span>
                {sellingPriceCents > 0 && (
                  <span className="mt-0.5 inline-flex items-baseline gap-2 text-[13.5px] sm:text-[14.5px]">
                    <span className="font-extrabold text-brand-red-dark">
                      {formatRupees(sellingPriceCents)}
                    </span>
                    {discountPct > 0 && (
                      <span className="text-[12px] font-medium text-black/45 line-through">
                        {formatRupees(book.price_cents)}
                      </span>
                    )}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Small Dot Indicators (GPU-only transform + opacity) */}
        {count > 1 && (
          <div
            role="group"
            aria-label="நூல் தேர்வு / Slide navigation"
            className="mt-0.5 flex flex-wrap items-center justify-center gap-0.5"
          >
            {books.map((book, idx) => {
              const isActive = idx === safeIndex;
              return (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => goTo(idx)}
                  aria-label={`நூல் ${idx + 1} (மொத்தம் ${count}) / Book ${idx + 1} of ${count}`}
                  aria-current={isActive ? "true" : undefined}
                  className="group inline-flex h-9 min-w-[30px] items-center justify-center px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-1 rounded-full"
                >
                  <span
                    className={`hero-carousel-fade block h-2 w-5 origin-center rounded-full transition-[transform,opacity] duration-300 ease-out ${
                      isActive
                        ? "scale-x-100 bg-brand-red opacity-100"
                        : "scale-x-[0.4] bg-black opacity-30 group-hover:opacity-55"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
