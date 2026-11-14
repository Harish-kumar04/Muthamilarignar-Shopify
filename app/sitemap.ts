import type { MetadataRoute } from "next";
import { listCollections, listProducts } from "@/lib/shopify";
import { SITE_URL } from "@/lib/site-defaults";
import { AUTHORS, POLICY_LAST_UPDATED_ISO } from "@/lib/aeo-data";

export const revalidate = 120;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let publishedBooks: { slug: string; updated_at?: string }[] = [];
  let categories: { slug: string; updated_at?: string }[] = [];

  try {
    const [prodRes, colRes] = await Promise.all([
      listProducts({ first: 250 }),
      listCollections({ first: 100 }),
    ]);
    publishedBooks = prodRes.products.filter((b) => Boolean(b?.slug));
    categories = colRes.collections.filter((c) => Boolean(c?.slug));
  } catch {
    // Emit static routes cleanly when Shopify is temporarily unavailable
  }

  const now = new Date();
  const policyDate = new Date(POLICY_LAST_UPDATED_ISO);

  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/books`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified: policyDate, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/authors`, lastModified: policyDate, changeFrequency: "monthly", priority: 0.7 },
    ...AUTHORS.map((a) => ({
      url: `${SITE_URL}/authors/${a.slug}`,
      lastModified: policyDate,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${SITE_URL}/faq`, lastModified: policyDate, changeFrequency: "monthly", priority: 0.7 },
    ...(["shipping", "returns", "privacy", "terms"] as const).map((slug) => ({
      url: `${SITE_URL}/policies/${slug}`,
      lastModified: policyDate,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
    ...categories.map((c) => ({
      url: `${SITE_URL}/categories/${encodeURIComponent(String(c.slug))}`,
      lastModified: c.updated_at ? new Date(c.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...publishedBooks.map((b) => ({
      url: `${SITE_URL}/books/${encodeURIComponent(String(b.slug))}`,
      lastModified: b.updated_at ? new Date(b.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
