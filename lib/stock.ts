/**
 * Shared stock & availability helpers used across catalog mapping, cart mapping,
 * ProductCard, BookDetailView, MiniCart, and /cart.
 *
 * Rules:
 * 1. Never coerce `null` or `undefined` `quantityAvailable` to `0` (`Number(null) === 0`).
 * 2. Treat a variant as out of stock ONLY when `availableForSale === false`
 *    OR when `quantityAvailable` is a finite number `<= 0`.
 */

export function normalizeQuantityAvailable(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function isVariantOutOfStock(
  availableForSale?: boolean | null,
  quantityAvailable?: unknown,
): boolean {
  if (availableForSale === false) return true;
  const qty = normalizeQuantityAvailable(quantityAvailable);
  if (qty !== null && qty <= 0) return true;
  return false;
}

export function isVariantInStock(
  availableForSale?: boolean | null,
  quantityAvailable?: unknown,
): boolean {
  return !isVariantOutOfStock(availableForSale, quantityAvailable);
}
