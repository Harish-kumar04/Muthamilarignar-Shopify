import type { MetadataRoute } from "next";
import {
  fetchBooksSafe,
  getCategoriesWithFallback,
} from "@/lib/catalog-fallback";
import { SITE_URL } from "@/lib/site-defaults";
import { AUTHORS, POLICY_LAST_UPDATED_ISO } from "@/lib/aeo-data";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [booksRes, categories] = await Promise.all([
    fetchBooksSafe(),
    getCategoriesWithFallback(),
  ]);
  const publishedBooks = booksRes.isFallback
    ? []
    : (booksRes.books as any[]).filter((b) => b?.id || b?.slug);
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
    ...(categories as any[])
      .filter((c) => c?.slug)
      .map((c) => ({
        url: `${SITE_URL}/categories/${encodeURIComponent(String(c.slug))}`,
        lastModified: c.updated_at ? new Date(c.updated_at) : now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ...publishedBooks.map((b) => ({
      url: `${SITE_URL}/books/${encodeURIComponent(String(b.slug || b.id))}`,
      lastModified: b.updated_at ? new Date(b.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
