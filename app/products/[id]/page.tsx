import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BookDetailView from "@/components/product/book-detail-view";
import {
  getBookByHandleSafe,
  getCatalogSummarySafe,
  getProductRecommendations,
  type ShopifyBook,
} from "@/lib/shopify";
import { splitBilingual } from "@/lib/i18n";
import { BRAND, LOGO_ALT, getShareLogoUrl } from "@/lib/site-defaults";
import { absoluteUrl, bookCanonicalUrl, buildBookJsonLd } from "@/lib/seo-schema";

export const revalidate = 120;

export async function generateStaticParams() {
  const summary = await getCatalogSummarySafe();
  if (!summary.ok) return [];
  return summary.products
    .filter((b) => b?.slug)
    .map((b) => ({ id: String(b.slug) }));
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const lookup = await getBookByHandleSafe(params.id);
  if (lookup.status !== "ok") {
    return { title: `Book | ${BRAND.nameEn}`, robots: { index: false, follow: true } };
  }
  const product = lookup.product;
  const [ta, en] = splitBilingual(product.name, "|");
  const [descTa, descEn] = splitBilingual(product.description, "||");
  const title = product.meta_title || `${ta}${en && en !== ta ? ` | ${en}` : ""} — ${BRAND.nameTa}`;
  const description = (product.meta_description || descTa || descEn || `Buy ${en} from ${BRAND.nameEn}`).slice(0, 300);
  const canonical = bookCanonicalUrl(product);
  const coverUrl = absoluteUrl(product.image_url || product.images?.[0]);
  const image = coverUrl || getShareLogoUrl();
  const alt = coverUrl ? `${ta} — ${en}` : LOGO_ALT;
  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "book",
      images: [{ url: image, alt }],
    },
    twitter: { card: "summary_large_image", title, description, images: [{ url: image, alt }] },
  };
}

async function resolveRelatedBooks(product: ShopifyBook): Promise<ShopifyBook[]> {
  try {
    const recs = await getProductRecommendations(product.id);
    if (recs.length > 0) return recs.slice(0, 4);
  } catch {
    // Fall back to collection peers
  }
  const summary = await getCatalogSummarySafe();
  if (!summary.ok) return [];
  return summary.products.filter((b) => b.id !== product.id).slice(0, 4);
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const lookup = await getBookByHandleSafe(params.id);

  if (lookup.status === "not_found") {
    notFound();
  }

  if (lookup.status !== "ok") {
    return (
      <div className="container-site py-20 text-center">
        <div className="mx-auto max-w-md rounded-2xl border border-amber-500/30 bg-white p-8 shadow-sm">
          <h1 className="text-[22px] font-extrabold text-[#111]">
            Store is temporarily unavailable
          </h1>
          <p className="mt-3 text-[13.5px] leading-relaxed text-black/60">
            சேவையகம் தற்காலிகமாகக் கிடைக்கவில்லை, மீண்டும் முயற்சிக்கவும்.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`/products/${encodeURIComponent(params.id)}`}
              className="btn-red h-11 px-6 text-[13.5px]"
            >
              மீண்டும் முயற்சி / Try Again
            </a>
            <Link
              href="/books"
              className="inline-flex h-11 items-center justify-center rounded-full border border-black/15 px-5 text-[13.5px] font-semibold text-black hover:border-brand-red-dark hover:text-brand-red-dark transition-colors"
            >
              அனைத்து நூல்கள் / All Books
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const product = lookup.product;
  const relatedBooks = await resolveRelatedBooks(product);
  const jsonLd = buildBookJsonLd({ product });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BookDetailView product={product} relatedBooks={relatedBooks} />
    </>
  );
}