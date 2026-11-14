import { cache } from "react";
import type { Metadata } from "next";
import BrandHero from "@/components/home/brand-hero";
import HeroSlider, { type SlideView } from "@/components/home/hero-slider";
import { TrustBar } from "@/components/home/highlights";
import CategoryTiles from "@/components/home/category-tiles";
import TabbedBooks from "@/components/home/tabbed-books";
import PublisherStory from "@/components/home/publisher-story";
import Testimonials from "@/components/home/testimonials";
import FaqSection from "@/components/home/faq-section";
import { NewsletterSection } from "@/components/home/why-newsletter";
import {
  DiagonalStripeDivider,
  SectionHeading,
  SunburstBackdrop,
} from "@/components/brand/patterns";
import ProductCard, { toCardProduct, type CardProduct } from "@/components/product/product-card";
import {
  fetchBooksSafe,
  getCategoriesWithFallback,
  getStoreWithFallback,
} from "@/lib/catalog-fallback";
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

// ISR: static HTML, refreshed in the background every 60 seconds.
export const revalidate = 60;

const fetchHomeData = cache(async () => {
  const [booksRes, store, categories] = await Promise.all([
    fetchBooksSafe(),
    getStoreWithFallback(),
    getCategoriesWithFallback(),
  ]);
  return {
    products: booksRes.books as any[],
    isFallback: booksRes.isFallback,
    store,
    categories: categories as any[],
  };
});

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStoreWithFallback();
  const title = `${BRAND.nameTa} | ${BRAND.nameEn} — Official Tamil & English Bookstore`;
  const description =
    store?.description ||
    "முத்தமிழறிஞர் பதிப்பகம் — திராவிட இயக்க வரலாறு, சமூகநீதி மற்றும் கலைஞர் படைப்புகள் | Official Bookstore of Muthamilarignar Pathipagam with Pan-India COD & online delivery.";
  const url = SITE_URL;
  const ogImg = getShareLogoUrl(store);
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
        <p className="text-[16px] font-bold text-black">
          Store is temporarily unavailable, try again
        </p>
        <p className="mt-1 text-[14px] text-black/65">
          சேவையகம் தற்காலிகமாகக் கிடைக்கவில்லை, மீண்டும் முயற்சிக்கவும்.
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
  const { products, isFallback, store, categories } = await fetchHomeData();

  const cards = products.map((p) =>
    toCardProduct(isFallback ? { ...p, is_fallback: true } : p),
  );
  const seenCoverUrls = new Set<string>();
  const withCovers = cards.filter((c) => {
    if (!c.image_url) return false;
    if (seenCoverUrls.has(c.image_url)) return false;
    seenCoverUrls.add(c.image_url);
    return true;
  });
  const total = cards.length;

  // Admin-configured 3-image Offer Slider (or built-in brand slides decorated with distinct non-hero covers)
  const { slides, isDefault } = getSlides(store);
  const sliderPool = withCovers.slice(3);
  const slideViews: SlideView[] = slides.map((s, i) => {
    const href = resolveLink(s.link);
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
      covers: isDefault
        ? sliderPool.slice(i * 3, i * 3 + 3).map((c) => ({
            src: c.image_url as string,
            alt: splitBilingual(c.name, "|").join(" — "),
          }))
        : undefined,
    };
  });

  // Tabbed product groups from real catalog data
  const newArrivals = [...cards].reverse().slice(0, 8);
  const bestSellers = cards.slice(0, 8);
  const saleBooks = cards.filter(
    (c) => c.sale_price_cents && c.price_cents > 0 && c.sale_price_cents < c.price_cents,
  );
  const offers = (saleBooks.length > 0 ? saleBooks : cards).slice(0, 8);

  const kalaignarCatIds = new Set(
    categories
      .filter((cat: any) =>
        /kalaignar|karunanidhi|கலைஞர்/i.test(`${cat.name || ""} ${cat.slug || ""}`),
      )
      .map((cat: any) => String(cat.id)),
  );
  const kalaignarMatches = cards.filter(
    (c) =>
      (c.category_id && kalaignarCatIds.has(c.category_id)) ||
      /kalaignar|karunanidhi|கலைஞர்/i.test(`${c.name} ${c.author || ""}`),
  );
  const kalaignarWorks = (kalaignarMatches.length > 0 ? kalaignarMatches : cards).slice(0, 8);

  const logoUrl = getLogoUrl(store);
  const jsonLd = buildHomeJsonLd(logoUrl);

  return (
    <>
      {/* Fallback Notice Banner when API is temporarily unreachable */}
      {Boolean(isFallback) && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs font-semibold text-amber-950">
          சேவையகம் தற்காலிகமாகக் கிடைக்கவில்லை, மீண்டும் முயற்சிக்கவும் — Store is temporarily unavailable, try again.
        </div>
      )}

      {/* 1. Brand Landing Hero (Red Arch + Tilted Covers + Floating Real Badges + Real Stats Row) */}
      <BrandHero
        heroBooks={withCovers.length > 0 ? withCovers : cards}
        totalBooks={total}
        categoryCount={categories.length}
      />

      {/* 2. Trust Badges (COD, Razorpay Secure, Official Publisher, Pan-India Delivery) */}
      <TrustBar />

      {/* 3. Category Tiles with Custom Icons (#FAFAFA) */}
      <CategoryTiles categories={categories} />

      {/* 4. Tabbed Product Rows (New Arrivals | Best Sellers | Offers | Kalaignar Works) */}
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
          new: renderTabGrid(newArrivals, Boolean(isFallback)),
          bestsellers: renderTabGrid(bestSellers, Boolean(isFallback)),
          offers: renderTabGrid(offers, Boolean(isFallback)),
          kalaignar: renderTabGrid(kalaignarWorks, Boolean(isFallback)),
        }}
      />

      <DiagonalStripeDivider />

      {/* 5. Admin-Controlled 3-Image Offer Slider */}
      <HeroSlider slides={slideViews} />

      {/* 6. Author & Publisher Story (#FAFAFA) */}
      <PublisherStory totalBooks={total} logoUrl={logoUrl} />

      <DiagonalStripeDivider />

      {/* 7. Reader Testimonials (#FFFFFF) */}
      <Testimonials />

      {/* 8. Crawlable FAQ Section + FAQPage JSON-LD (AEO / GEO) */}
      <FaqSection />

      {/* 9. Newsletter with Visible Inline Success (#FAFAFA) */}
      <NewsletterSection storeId={store?.id} />

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