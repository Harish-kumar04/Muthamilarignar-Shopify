/**
 * Priority configuration & helpers for the flagship featured book
 * "காலத்தின் நிறம் கருப்பு சிவப்பு" (handle: kaalatthin-niram-karuppu-sivappu)
 * and any product carrying the Shopify `featured` tag.
 */

export const FEATURED_BOOK_HANDLE = "kaalatthin-niram-karuppu-sivappu";

export const FEATURED_BOOK_COVER_URL =
  "https://res.cloudinary.com/dikaxqooz/image/upload/v1794497416/Kalathin_Niram_Karupu_Sigapu_1_jhvmlh.png";

export const WHITE_LOGO_BANNER_URL =
  "https://res.cloudinary.com/dikaxqooz/image/upload/v1794758234/shopify_white_logo_banner_8k_rn9z1s.png";

export interface FeaturedCandidate {
  id?: string | null;
  handle?: string | null;
  slug?: string | null;
  tags?: string[] | null;
  isFeatured?: boolean | null;
}

export function isFeaturedBook(item?: FeaturedCandidate | null): boolean {
  if (!item) return false;
  if (item.isFeatured === true) return true;
  const handle = String(item.handle || item.slug || "")
    .trim()
    .toLowerCase();
  if (handle === FEATURED_BOOK_HANDLE) return true;
  if (Array.isArray(item.tags)) {
    return item.tags.some((t) => String(t).trim().toLowerCase() === "featured");
  }
  return false;
}

/**
 * Stable partition that places featured book(s) first (with the flagship handle
 * `kaalatthin-niram-karuppu-sivappu` leading) while preserving the relative order
 * of all remaining items.
 */
export function prioritizeFeaturedBooks<T extends FeaturedCandidate>(items: T[]): T[] {
  if (!Array.isArray(items) || items.length <= 1) return items;
  const flagship: T[] = [];
  const taggedFeatured: T[] = [];
  const rest: T[] = [];

  for (const item of items) {
    const handle = String(item?.handle || item?.slug || "")
      .trim()
      .toLowerCase();
    if (handle === FEATURED_BOOK_HANDLE) {
      flagship.push(item);
    } else if (isFeaturedBook(item)) {
      taggedFeatured.push(item);
    } else {
      rest.push(item);
    }
  }

  if (flagship.length === 0 && taggedFeatured.length === 0) return items;
  return [...flagship, ...taggedFeatured, ...rest];
}

/**
 * Whether a search query targets "கருப்பு சிவப்பு" / "காலத்தின் நிறம் கருப்பு சிவப்பு"
 * (in Tamil or transliterated English) so the flagship book is guaranteed to rank #1.
 */
export function isKaruppuSivappuQuery(query?: string | null): boolean {
  if (!query) return false;
  const normalized = query.trim().toLowerCase().replace(/\s+/g, " ");
  if (!normalized) return false;
  return (
    normalized.includes("கருப்பு சிவப்பு") ||
    normalized.includes("காலத்தின் நிறம்") ||
    normalized.includes("karuppu sivappu") ||
    normalized.includes("karupu sigapu") ||
    normalized.includes("kaalatthin niram") ||
    normalized.includes("kalathin niram")
  );
}
