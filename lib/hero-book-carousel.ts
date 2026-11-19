/**
 * Pure index, slot-assignment, and discount-truthfulness helpers
 * for the home-page hero featured-books 3D carousel.
 */

export type CarouselSlot = "front" | "prev" | "next" | "hidden";

/** Wraps any integer index into `[0, total - 1]` (returns `0` when `total <= 0`). */
export function normalizeSlideIndex(index: number, total: number): number {
  if (!Number.isFinite(total) || total <= 0) return 0;
  const intTotal = Math.floor(total);
  const intIndex = Number.isFinite(index) ? Math.trunc(index) : 0;
  return ((intIndex % intTotal) + intTotal) % intTotal;
}

/** Advances to the next slide index, wrapping from `total - 1` back to `0`. */
export function nextSlideIndex(current: number, total: number): number {
  if (!Number.isFinite(total) || total <= 1) return 0;
  return normalizeSlideIndex(normalizeSlideIndex(current, total) + 1, total);
}

/** Steps back to the previous slide index, wrapping from `0` to `total - 1`. */
export function prevSlideIndex(current: number, total: number): number {
  if (!Number.isFinite(total) || total <= 1) return 0;
  return normalizeSlideIndex(normalizeSlideIndex(current, total) - 1, total);
}

/**
 * Maps each book index to its coverflow stage position relative to `activeIndex`:
 * - `"front"`: centre stage active book
 * - `"prev"`: peeking on the left (only when `total >= 3`)
 * - `"next"`: peeking on the right (when `total >= 2`)
 * - `"hidden"`: tucked behind centre stage
 */
export function getCarouselSlot(
  itemIndex: number,
  activeIndex: number,
  total: number,
): CarouselSlot {
  if (!Number.isFinite(total) || total <= 0) return "hidden";
  const count = Math.floor(total);
  const active = normalizeSlideIndex(activeIndex, count);
  const idx = normalizeSlideIndex(itemIndex, count);

  if (idx === active) return "front";
  if (count === 2) return "next";

  const prev = prevSlideIndex(active, count);
  const next = nextSlideIndex(active, count);
  if (idx === prev) return "prev";
  if (idx === next) return "next";
  return "hidden";
}

/**
 * Returns a positive integer discount percentage ONLY when `salePriceCents`
 * represents a genuine discount below `priceCents`. Otherwise returns `0`
 * so the UI never displays a misleading discount chip.
 */
export function getTruthfulDiscountPct(
  priceCents: number,
  salePriceCents?: number | null,
): number {
  if (
    typeof priceCents !== "number" ||
    !Number.isFinite(priceCents) ||
    priceCents <= 0 ||
    typeof salePriceCents !== "number" ||
    !Number.isFinite(salePriceCents) ||
    salePriceCents <= 0 ||
    salePriceCents >= priceCents
  ) {
    return 0;
  }
  return Math.max(1, Math.round(((priceCents - salePriceCents) / priceCents) * 100));
}
