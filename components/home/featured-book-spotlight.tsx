import Link from "next/link";
import Img from "@/components/ui/img";
import { BiName, BiSubName, T } from "@/components/i18n/t";
import CardAddButton from "@/components/product/card-add-button";
import { isStoreProductId } from "@/components/product/product-card";
import { FEATURED_BOOK_COVER_URL, FEATURED_BOOK_HANDLE } from "@/lib/featured-book";
import { splitBilingual } from "@/lib/i18n";
import type { ShopifyBook } from "@/lib/shopify";
import { cloudinaryImageUrl } from "@/lib/site-defaults";
import { isVariantOutOfStock, normalizeQuantityAvailable } from "@/lib/stock";

const rupees = (cents: number) => `₹${Math.round(cents / 100).toLocaleString("en-IN")}`;

function extractShopifyParagraphs(
  descriptionHtml?: string | null,
  description?: string | null,
): string[] {
  if (descriptionHtml && descriptionHtml.trim()) {
    const paragraphs = descriptionHtml
      .replace(/<\/p>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (paragraphs.length > 0) return paragraphs;
  }
  return description && description.trim() ? [description.trim()] : [];
}

/**
 * Large "Featured book / சிறப்பு நூல்" spotlight placed immediately below the hero on `/`.
 * Uses live Shopify title, description, price, and stock status — never hardcoded facts or prices.
 */
export default function FeaturedBookSpotlight({
  book,
}: {
  book: ShopifyBook | null;
}) {
  if (!book) return null;

  const qtyAvailable = normalizeQuantityAvailable(book.quantityAvailable);
  const inStock = !isVariantOutOfStock(book.availableForSale, qtyAvailable);
  const lowStock =
    inStock &&
    qtyAvailable !== null &&
    qtyAvailable > 0 &&
    qtyAvailable <= 5;

  const onSale = Boolean(
    book.sale_price_cents &&
      book.price_cents > 0 &&
      book.sale_price_cents < book.price_cents,
  );
  const price = onSale ? (book.sale_price_cents as number) : book.price_cents;
  const discountPct = onSale
    ? Math.max(
        1,
        Math.round(
          ((book.price_cents - (book.sale_price_cents as number)) / book.price_cents) * 100,
        ),
      )
    : 0;

  const isFlagship =
    String(book.handle || book.slug || "")
      .trim()
      .toLowerCase() === FEATURED_BOOK_HANDLE;
  const rawCover = isFlagship
    ? FEATURED_BOOK_COVER_URL
    : book.image_url || book.images?.[0] || FEATURED_BOOK_COVER_URL;
  const coverSrc = cloudinaryImageUrl(rawCover, 900);

  const [titleTa, titleEn] = splitBilingual(book.name, "|");
  const hasDistinctSub = Boolean(titleEn && titleEn !== titleTa);
  const alt = hasDistinctSub
    ? `${titleTa} — ${titleEn} (சிறப்பு நூல் அட்டைப்படம் | Featured book cover)`
    : `${titleTa} (சிறப்பு நூல் அட்டைப்படம் | Featured book cover)`;
  const bookHref = `/books/${encodeURIComponent(book.slug || book.handle || book.id)}`;
  const descriptionParagraphs = extractShopifyParagraphs(
    book.description_html,
    book.description,
  );

  return (
    <section
      id="featured-book-spotlight"
      aria-label="சிறப்பு நூல் | Featured book"
      className="relative overflow-hidden border-b border-black/[0.08] bg-gradient-to-b from-white via-[#FFFDFD] to-[#FAFAFA] py-12 sm:py-16 lg:py-20"
    >
      <div className="container-site relative">
        <div className="overflow-hidden rounded-3xl border-2 border-black/10 bg-white shadow-card">
          <div className="h-1.5 w-full bg-gradient-to-r from-black via-brand-red to-black" aria-hidden="true" />
          <div className="grid grid-cols-1 items-center gap-8 p-6 sm:p-10 lg:grid-cols-12 lg:gap-12 lg:p-12">
            {/* Big Cover (>= 2x normal book card dimensions, 1017x1547 intrinsic) */}
            <div className="mx-auto w-full max-w-[19.375rem] sm:max-w-[26.25rem] lg:col-span-6 lg:max-w-[29rem]">
              <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-[#FAFAFA] p-3 shadow-sm sm:p-4">
                <div className="pointer-events-none absolute left-3.5 top-3.5 z-10 flex flex-col items-start gap-1.5">
                  <span
                    data-featured-ribbon="true"
                    className="inline-flex items-center gap-1.5 rounded-r-full rounded-tl-full bg-black px-3 py-1 text-[11.5px] font-extrabold uppercase tracking-wider text-white shadow-sm ring-1 ring-brand-red/80"
                  >
                    <span aria-hidden="true" className="text-brand-red">★</span>
                    <T ta="சிறப்பு நூல்" en="Featured" />
                  </span>
                  {onSale && inStock && (
                    <span className="rounded-full bg-[#D11D1A] px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-white shadow-sm">
                      {discountPct}% OFF
                    </span>
                  )}
                </div>

                <Link href={bookHref} prefetch={false} aria-label={alt} className="block">
                  <Img
                    src={coverSrc}
                    alt={alt}
                    width={1017}
                    height={1547}
                    sizes="(max-width: 640px) 88vw, (max-width: 1024px) 420px, 500px"
                    className={`mx-auto h-auto w-full rounded-xl object-contain transition-transform duration-300 hover:scale-[1.02] ${
                      !inStock ? "opacity-65 grayscale-[35%]" : ""
                    }`}
                  />
                </Link>
              </div>
            </div>

            {/* Live Shopify Title, Description, Price, Stock, and Cart Actions */}
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-red/25 bg-brand-red/[0.06] px-3.5 py-1.5 text-[12px] font-extrabold uppercase tracking-[0.14em] text-brand-red-dark">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-brand-red" />
                <T ta="சிறப்பு நூல்" en="Featured book" />
              </div>

              <Link href={bookHref} prefetch={false} className="group block">
                <h2 className="mt-4 text-[1.75rem] font-extrabold leading-[1.15] tracking-tight text-black transition-colors group-hover:text-brand-red-dark sm:text-[2.25rem] lg:text-[2.625rem]">
                  <BiName value={book.name} />
                </h2>
              </Link>

              {hasDistinctSub && (
                <p className="mt-1.5 text-[16px] font-semibold text-black/65 sm:text-[18px]">
                  <BiSubName value={book.name} />
                </p>
              )}

              <div aria-hidden="true" className="mt-4 h-1 w-16 rounded-full bg-brand-red" />

              {descriptionParagraphs.length > 0 && (
                <div className="mt-5 max-w-2xl space-y-2.5 text-[16px] leading-relaxed text-black/80 sm:text-[17px]">
                  {descriptionParagraphs.map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>
              )}

              {/* Live Price & Stock Status */}
              <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-black/[0.08] pt-5">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-[30px] font-extrabold tracking-tight text-brand-red sm:text-[34px]">
                    {rupees(price)}
                  </span>
                  {onSale && (
                    <span className="text-[16px] font-medium text-black/50 line-through">
                      {rupees(book.price_cents)}
                    </span>
                  )}
                </div>

                {inStock ? (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold ${
                      lowStock
                        ? "bg-amber-500/10 text-amber-900"
                        : "bg-green-600/10 text-green-800"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`h-2 w-2 rounded-full ${
                        lowStock ? "bg-amber-600" : "bg-green-600"
                      }`}
                    />
                    {lowStock ? (
                      <T
                        ta={`இன்னும் ${qtyAvailable} மட்டுமே`}
                        en={`Only ${qtyAvailable} left`}
                      />
                    ) : (
                      <T ta="பிரதிகள் உள்ளன" en="In stock" />
                    )}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-red/10 px-3 py-1 text-[13px] font-bold text-brand-red-dark">
                    <span aria-hidden="true" className="h-2 w-2 rounded-full bg-brand-red" />
                    <T ta="பிரதிகள் தீர்ந்துவிட்டன" en="Out of stock" />
                  </span>
                )}
              </div>

              {/* Buy Now + Add to Cart using shared cart & stock logic */}
              <CardAddButton
                layout="spotlight"
                productId={book.id}
                variantId={book.variant_id}
                productName={book.name}
                unitPriceCents={price}
                inStock={inStock}
                availableForSale={book.availableForSale !== false}
                quantityAvailable={qtyAvailable}
                isFallback={!isStoreProductId(book.id)}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
