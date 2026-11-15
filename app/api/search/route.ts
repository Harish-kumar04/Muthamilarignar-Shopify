import { NextRequest, NextResponse } from "next/server";
import {
  FEATURED_BOOK_HANDLE,
  isFeaturedBook,
  isKaruppuSivappuQuery,
  prioritizeFeaturedBooks,
} from "@/lib/featured-book";
import { getProductByHandle, searchProducts } from "@/lib/shopify";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return NextResponse.json({ books: [] });
  }

  try {
    const { products: rawProducts } = await searchProducts({ query: q, first: 6 });
    let ordered = rawProducts;

    if (isKaruppuSivappuQuery(q)) {
      if (!ordered.some((p) => p.handle.toLowerCase() === FEATURED_BOOK_HANDLE)) {
        const direct = await getProductByHandle(FEATURED_BOOK_HANDLE).catch(() => null);
        if (direct) {
          ordered = [direct, ...ordered];
        }
      }
      ordered = prioritizeFeaturedBooks(ordered).slice(0, 6);
    }

    const books = ordered.map((p) => ({
      id: p.id,
      slug: p.slug,
      isFeatured: isFeaturedBook(p),
      name: p.name,
      author: p.author,
      price_cents: p.price_cents,
      sale_price_cents: p.sale_price_cents,
      image_url: p.image_url,
    }));
    return NextResponse.json({ books });
  } catch {
    return NextResponse.json(
      { books: [], unavailable: true, error: "Store is temporarily unavailable" },
      { status: 503 },
    );
  }
}
