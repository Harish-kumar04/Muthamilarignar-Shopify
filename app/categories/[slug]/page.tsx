import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard, { toCardProduct } from "@/components/product/product-card";
import { BiName, BiSubName, T } from "@/components/i18n/t";
import { splitBilingual } from "@/lib/i18n";
import {
  getCatalogSummarySafe,
  getCollectionByHandle,
  type SafeCollectionLookup,
} from "@/lib/shopify";
import { BRAND, LOGO_ALT, SITE_URL, getShareLogoUrl } from "@/lib/site-defaults";
import { absoluteUrl, buildListingJsonLd, PUBLISHER_ENTITY } from "@/lib/seo-schema";

export const revalidate = 120;

const fetchCategorySafe = cache(async (handle: string): Promise<SafeCollectionLookup> => {
  try {
    const res = await getCollectionByHandle(handle, { first: 48 });
    if (!res) return { status: "not_found" };
    return {
      status: "ok",
      collection: res.collection,
      products: res.products,
      pageInfo: res.pageInfo,
    };
  } catch (err: any) {
    return {
      status: "unavailable",
      error: err?.message || "Store is temporarily unavailable",
    };
  }
});

export async function generateStaticParams() {
  const summary = await getCatalogSummarySafe();
  if (!summary.ok) return [];
  return summary.collections
    .filter((c) => c?.slug)
    .map((c) => ({ slug: String(c.slug) }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const lookup = await fetchCategorySafe(params.slug);
  if (lookup.status !== "ok") {
    return { title: `நூல் வகை | Category — ${BRAND.nameEn}`, robots: { index: false } };
  }
  const cat = lookup.collection;
  const [ta, en] = splitBilingual(cat.name, "|");
  const title = `${ta}${en && en !== ta ? ` | ${en}` : ""} — ${BRAND.nameTa} | ${BRAND.nameEn}`;
  const description =
    cat.description ||
    `Explore ${en || ta} publications from ${BRAND.nameEn} (${BRAND.nameTa}).`;
  const url = `${SITE_URL}/categories/${cat.slug}`;
  const shareLogo = absoluteUrl(cat.image_url) || getShareLogoUrl();
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: `${BRAND.nameTa} | ${BRAND.nameEn}`,
      locale: "ta_IN",
      type: "website",
      images: [{ url: shareLogo, alt: LOGO_ALT }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: shareLogo, alt: LOGO_ALT }],
    },
  };
}

export default async function CategoryDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const lookup = await fetchCategorySafe(params.slug);

  if (lookup.status === "not_found") {
    notFound();
  }

  if (lookup.status === "unavailable") {
    return (
      <div className="container-site py-20 text-center">
        <div className="mx-auto max-w-md rounded-2xl border border-amber-500/30 bg-amber-500/5 px-6 py-14">
          <h1 className="text-[20px] font-extrabold text-black">
            Store is temporarily unavailable
          </h1>
          <p className="mt-2 text-[14px] text-black/65">
            சேவையகம் தற்காலிகமாகக் கிடைக்கவில்லை, மீண்டும் முயற்சிக்கவும்.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href="/books" className="btn-red h-11 px-6 text-[14px]">
              <T ta="அனைத்து நூல்களையும் காண்க" en="Browse all books" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const cat = lookup.collection;
  const catBooks = lookup.products;
  const [ta, en] = splitBilingual(cat.name, "|");
  const hasDistinctSub = Boolean(en && en !== ta);
  const pageUrl = `${SITE_URL}/categories/${cat.slug}`;

  const jsonLd = buildListingJsonLd({
    url: pageUrl,
    listName: `${ta}${hasDistinctSub ? ` | ${en}` : ""}`,
    books: catBooks,
    breadcrumbs: [
      { name: `${PUBLISHER_ENTITY.nameTa} | Home`, url: SITE_URL },
      { name: "நூல்கள் | Books", url: `${SITE_URL}/books` },
      { name: hasDistinctSub ? `${ta} | ${en}` : ta, url: pageUrl },
    ],
  });

  return (
    <div className="container-site py-10 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex flex-wrap items-center gap-1.5 text-[13px] text-black/70"
      >
        <Link href="/" prefetch={false} className="hover:text-brand-red-dark">
          <T ta="முகப்பு" en="Home" />
        </Link>
        <span aria-hidden="true" className="opacity-40">/</span>
        <Link href="/books" prefetch={false} className="hover:text-brand-red-dark">
          <T ta="நூல்கள்" en="Books" />
        </Link>
        <span aria-hidden="true" className="opacity-40">/</span>
        <span className="font-semibold text-black">
          <BiName value={cat.name} />
        </span>
      </nav>

      <header className="mb-10">
        <p className="eyebrow">
          <T ta="நூல் வகை" en="Book Category" />
        </p>
        <h1 className="mt-2 text-[32px] font-extrabold leading-tight tracking-tight text-black sm:text-[44px]">
          <BiName value={cat.name} />
        </h1>
        {hasDistinctSub && (
          <p className="mt-1 text-[17px] font-medium text-black/65">
            <BiSubName value={cat.name} />
          </p>
        )}
        <div aria-hidden="true" className="mt-3 h-1 w-14 rounded-full bg-brand-red" />
        {cat.description && (
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-black/70">
            {cat.description}
          </p>
        )}
      </header>

      <h2 className="sr-only">
        <T ta={`${catBooks.length} நூல்கள்`} en={`${catBooks.length} books in this category`} />
      </h2>

      {catBooks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/20 bg-[#FAFAFA] px-6 py-16 text-center">
          <p className="text-[15px] text-black/70">
            <T
              ta="இந்தப் பிரிவில் நூல்கள் விரைவில் சேர்க்கப்படும்."
              en="Books in this category will be added shortly."
            />
          </p>
          <Link href="/books" className="btn-red mt-5 h-11 px-6 text-[14px]">
            <T ta="அனைத்து நூல்களையும் காண்க" en="Browse all books" />
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 xl:grid-cols-5">
            {catBooks.map((p) => (
              <ProductCard key={p.id} product={toCardProduct(p)} />
            ))}
          </div>

          {lookup.pageInfo.hasNextPage && (
            <div className="mt-10 flex justify-center">
              <Link
                href={`/books?category=${encodeURIComponent(cat.slug)}${
                  lookup.pageInfo.endCursor
                    ? `&after=${encodeURIComponent(lookup.pageInfo.endCursor)}`
                    : ""
                }`}
                className="btn-black h-12 px-7 text-[14px]"
              >
                <T ta="மேலும் நூல்களைக் காண்க →" en="View more in this category →" />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
