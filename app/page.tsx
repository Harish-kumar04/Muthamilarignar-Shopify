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
import { getCatalogSummarySafe, listProducts } from "@/lib/shopify";
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
      products: [],
      newestProducts: [],
      categories: [],
      apiUnavailable: true,
    };
  }
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
  return {
    products: summary.products,
    newestProducts,
    categories: summary.collections,
    apiUnavailable: false,
  };
});

export async function generateMetadata(): Promise<Metadata> {
  const title = `${BRAND.nameTa} | ${BRAND.nameEn} — Official Tamil & English Bookstore`;
  const description =
    "முத்தமிழறிஞர் பதிப்பகம் — திராவிட இயக்க வரலாறு, சமூகநீதி மற்றும் கலைஞர் படைப்புகள் | Official Bookstore of Muthamilarignar Pathipagam with Pan-India COD & online delivery.";
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
        <p className="text-[16px] font-bold text-black">
          Store is temporarily unavailable
        </p>
        <p className="mt-1 text-[14px] text-black/65">
          சேவையகம் தற்காலிகமாகக் கிடைக்கவில்லை, மீண்டும் முயற்சிக்கவும்.
        </p>
      </div>
    );
  }
  if (list.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/15 px-6 py-14 text-center text-[15px] text-black/65">
        நூல்கள் விரைவில் சேர்க்கப்படும் / Books will appear here soon.
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
  const { products, newestProducts, categories, apiUnavailable } = await fetchHomeData();

  const cards = products.map((p) => toCardProduct(p));
  const seenCoverUrls = new Set<string>();
  const withCovers = cards.filter((c) => {
    if (!c.image_url) return false;
    if (seenCoverUrls.has(c.image_url)) return false;
    seenCoverUrls.add(c.image_url);
    return true;
  });
  const total = cards.length;

  const { slides, isDefault } = getSlides();
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

  const newArrivals = newestProducts.map((p) => toCardProduct(p)).slice(0, 8);
  const bestSellers = cards.slice(0, 8);
  const saleBooks = cards.filter(
    (c) => c.sale_price_cents && c.price_cents > 0 && c.sale_price_cents < c.price_cents,
  );
  const offers = (saleBooks.length > 0 ? saleBooks : cards).slice(0, 8);

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
  const kalaignarWorks = (kalaignarMatches.length > 0 ? kalaignarMatches : cards).slice(0, 8);

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

      {/* 2. Trust Badges */}
      <TrustBar />

      {/* 3. Category Tiles from Shopify Collections */}
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
          new: renderTabGrid(newArrivals, apiUnavailable),
          bestsellers: renderTabGrid(bestSellers, apiUnavailable),
          offers: renderTabGrid(offers, apiUnavailable),
          kalaignar: renderTabGrid(kalaignarWorks, apiUnavailable),
        }}
      />

      <DiagonalStripeDivider />

      {/* 5. Offer Slider */}
      <HeroSlider slides={slideViews} />

      {/* 6. Author & Publisher Story */}
      <PublisherStory totalBooks={total} logoUrl={logoUrl} />

      <DiagonalStripeDivider />

      {/* 7. Reader Testimonials */}
      <Testimonials />

      {/* 8. Crawlable FAQ Section + FAQPage JSON-LD */}
      <FaqSection />

      {/* 9. Newsletter */}
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