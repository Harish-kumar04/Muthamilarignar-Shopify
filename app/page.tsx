import { cache } from "react";
import type { Metadata } from "next";
import BrandHero from "@/components/home/brand-hero";
import FeaturedBookSpotlight from "@/components/home/featured-book-spotlight";
import HeroSlider, { type SlideView } from "@/components/home/hero-slider";
import { TrustBar } from "@/components/home/highlights";
import TabbedBooks from "@/components/home/tabbed-books";
import {
  DarkBrandBannerStrip,
  KalaignarArtworkBanner,
} from "@/components/home/editorial-art-sections";
import FaqSection from "@/components/home/faq-section";
import { NewsletterSection } from "@/components/home/why-newsletter";
import {
  SectionHeading,
  SunburstBackdrop,
} from "@/components/brand/patterns";
import ProductCard, { toCardProduct, type CardProduct } from "@/components/product/product-card";
import {
  FEATURED_BOOK_HANDLE,
  isFeaturedBook,
  prioritizeFeaturedBooks,
} from "@/lib/featured-book";
import {
  getBookByHandleSafe,
  getCatalogSummarySafe,
  listProducts,
  type ShopifyBook,
} from "@/lib/shopify";
import { splitBilingual } from "@/lib/i18n";
import {
  BRAND,
  LOGO_ALT,
  SITE_URL,
  getLogoUrl,
  getShareLogoUrl,
  getSlides,
  isExternal,
  resolveLink,
} from "@/lib/site-defaults";
import { buildHomeJsonLd } from "@/lib/seo-schema";
import { STORE_FAQS, buildFaqJsonLd } from "@/lib/aeo-data";

export const revalidate = 120;

const fetchHomeData = cache(async () => {
  const summary = await getCatalogSummarySafe();
  if (!summary.ok) {
    return {
      products: [] as ShopifyBook[],
      newestProducts: [] as ShopifyBook[],
      featuredBook: null as ShopifyBook | null,
      categories: [],
      apiUnavailable: true,
    };
  }
  let featuredBook: ShopifyBook | null =
    summary.products.find(
      (p) => p.handle.toLowerCase() === FEATURED_BOOK_HANDLE,
    ) ||
    summary.products.find((p) => isFeaturedBook(p)) ||
    null;

  if (!featuredBook) {
    const lookup = await getBookByHandleSafe(FEATURED_BOOK_HANDLE);
    if (lookup.status === "ok") {
      featuredBook = lookup.product;
    }
  }

  const orderedProducts = prioritizeFeaturedBooks(
    featuredBook && !summary.products.some((p) => p.id === featuredBook!.id)
      ? [featuredBook, ...summary.products]
      : summary.products,
  );

  let newestProducts = [...summary.products].reverse();
  try {
    const newestRes = await listProducts({
      first: 8,
      sortKey: "CREATED_AT",
      reverse: true,
    });
    if (newestRes.products.length > 0) {
      newestProducts = newestRes.products;
    }
  } catch {
    // Keep reversed summary list if secondary sort query fails
  }
  if (featuredBook) {
    newestProducts = [
      featuredBook,
      ...newestProducts.filter((p) => p.id !== featuredBook!.id),
    ];
  } else {
    newestProducts = prioritizeFeaturedBooks(newestProducts);
  }

  return {
    products: orderedProducts,
    newestProducts,
    featuredBook,
    categories: summary.collections,
    apiUnavailable: false,
  };
});

export async function generateMetadata(): Promise<Metadata> {
  const title = `${BRAND.nameTa} | ${BRAND.nameEn} — Official Tamil & English Bookstore`;
  const description =
    "முத்தமிழறிஞர் பதிப்பகம் — திராவிட இயக்கம், சமூகநீதி மற்றும் கலைஞர் குறித்த நூல்கள் | Official Bookstore of Muthamilarignar Pathipagam with Pan-India Cash on Delivery (COD).";
  const url = SITE_URL;
  const ogImg = getShareLogoUrl();
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: LOGO_ALT,
      locale: "ta_IN",
      type: "website",
      images: [{ url: ogImg, width: 1200, height: 1197, alt: LOGO_ALT }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImg] },
  };
}

function renderTabGrid(list: CardProduct[], apiUnavailable: boolean) {
  if (apiUnavailable) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-6 py-14 text-center">
        <p className="text-[17px] font-bold text-black">
          Store is temporarily unavailable
        </p>
        <p className="mt-1.5 text-[16px] text-black/70">
          சேவையகம் தற்காலிகமாகக் கிடைக்கவில்லை — சற்று கழித்து மீண்டும் முயற்சிக்கவும்.
        </p>
      </div>
    );
  }
  if (list.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/15 bg-[#FAFAFA] px-6 py-14 text-center text-[16px] text-black/70">
        <p className="font-semibold text-black">
          தற்போது நூல்கள் எதுவும் இல்லை / No books in this section right now
        </p>
        <p className="mt-1 text-[15px] text-black/65">
          புதிய பதிப்புகள் விரைவில் சேர்க்கப்படும் — New publisher editions will appear here soon.
        </p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      {list.map((book) => (
        <ProductCard
          key={book.id}
          product={book}
          sizes="(max-width: 640px) 46vw, (max-width: 1024px) 45vw, 310px"
        />
      ))}
    </div>
  );
}

export default async function HomePage() {
  const { products, newestProducts, featuredBook, categories, apiUnavailable } =
    await fetchHomeData();

  const cards = prioritizeFeaturedBooks(products.map((p) => toCardProduct(p)));
  const featuredCard = featuredBook ? toCardProduct(featuredBook) : cards[0] || null;
  const seenCoverUrls = new Set<string>();
  const withCovers = cards.filter((c) => {
    if (!c.image_url) return false;
    if (seenCoverUrls.has(c.image_url)) return false;
    seenCoverUrls.add(c.image_url);
    return true;
  });
  const total = cards.length;

  const { slides, isDefault } = getSlides();
  const slideViews: SlideView[] = slides.map((s, i) => {
    const href = resolveLink(s.link) || "/books";
    const start = withCovers.length > 0 ? (i * 3) % withCovers.length : 0;
    const covers =
      isDefault && withCovers.length > 0
        ? Array.from({ length: Math.min(3, withCovers.length) }, (_, idx) => {
            const c = withCovers[(start + idx) % withCovers.length];
            return {
              src: c.image_url as string,
              alt: splitBilingual(c.name, "|").join(" — "),
            };
          })
        : undefined;
    return {
      image_url: s.image_url || null,
      mobile_image_url: s.mobile_image_url || null,
      title_ta: s.title_ta || "",
      title_en: s.title_en || "",
      subtitle_ta: s.subtitle_ta || "",
      subtitle_en: s.subtitle_en || "",
      button_ta: s.button_ta || "",
      button_en: s.button_en || "",
      href,
      external: href ? isExternal(href) : false,
      covers,
    };
  });

  const newArrivals = prioritizeFeaturedBooks(
    newestProducts.map((p) => toCardProduct(p)),
  ).slice(0, 8);
  const bestSellers = cards.slice(0, 8);

  const kalaignarCatKeys = new Set<string>();
  for (const cat of categories) {
    if (/kalaignar|karunanidhi|கலைஞர்/i.test(`${cat.name || ""} ${cat.slug || ""}`)) {
      kalaignarCatKeys.add(String(cat.id));
      if (cat.slug) kalaignarCatKeys.add(String(cat.slug));
    }
  }
  const kalaignarMatches = cards.filter(
    (c) =>
      (c.category_id && kalaignarCatKeys.has(c.category_id)) ||
      c.collection_ids?.some((id) => kalaignarCatKeys.has(id)) ||
      c.collection_handles?.some((h) => kalaignarCatKeys.has(h)) ||
      /kalaignar|karunanidhi|கலைஞர்/i.test(`${c.name} ${c.author || ""}`),
  );
  const rawKalaignarPool = kalaignarMatches.length > 0 ? kalaignarMatches : cards;
  const kalaignarWorks = (
    featuredCard && isFeaturedBook(featuredCard)
      ? [featuredCard, ...rawKalaignarPool.filter((c) => c.id !== featuredCard.id)]
      : rawKalaignarPool
  ).slice(0, 8);

  const logoUrl = getLogoUrl();
  const jsonLd = buildHomeJsonLd(logoUrl);

  return (
    <>
      {apiUnavailable && (
        <div
          role="alert"
          className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-center text-xs font-semibold text-amber-950"
        >
          சேவையகம் தற்காலிகமாகக் கிடைக்கவில்லை — Store is temporarily unavailable
        </div>
      )}

      {/* 1. Brand Landing Hero */}
      <BrandHero
        heroBooks={withCovers.length > 0 ? withCovers : cards}
        totalBooks={total}
        categoryCount={categories.length}
        apiUnavailable={apiUnavailable}
      />

      {/* 2. Large "Featured book / சிறப்பு நூல்" Spotlight right below Hero */}
      <FeaturedBookSpotlight book={featuredBook} />

      {/* 3. Trust Badges */}
      <TrustBar />

      {/* 4. Tabbed Product Rows (New Arrivals | Essential Titles | Books on Kalaignar) */}
      <TabbedBooks
        totalCount={total}
        backdrop={<SunburstBackdrop position="top-right" />}
        heading={
          <SectionHeading
            eyebrow={{ ta: "முத்தமிழறிஞர் பதிப்பகம்", en: "Curated Shelf" }}
            title={{ ta: "தேர்ந்தெடுக்கப்பட்ட வெளியீடுகள்", en: "Featured & Essential Titles" }}
          />
        }
        panels={{
          new: renderTabGrid(newArrivals, apiUnavailable),
          bestsellers: renderTabGrid(bestSellers, apiUnavailable),
          kalaignar: renderTabGrid(kalaignarWorks, apiUnavailable),
        }}
      />

      {/* 5. Featured Editorial Promo Banner (Asset B: Kalaignar Sketch) */}
      <KalaignarArtworkBanner />

      {/* 6. Featured Collections Slider */}
      <HeroSlider slides={slideViews} />

      {/* 7. Crawlable 6-Question FAQ Section + Matching FAQPage JSON-LD */}
      <FaqSection faqs={STORE_FAQS} />

      {/* 12. Dark Brand Strip showcasing Asset D (White Logo Banner) */}
      <DarkBrandBannerStrip />

      {/* 13. Newsletter */}
      <NewsletterSection />

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildFaqJsonLd(STORE_FAQS, SITE_URL)),
        }}
      />
    </>
  );
}