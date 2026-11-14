import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/shopify";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return NextResponse.json({ books: [] });
  }

  try {
    const { products } = await searchProducts({ query: q, first: 6 });
    const books = products.map((p) => ({
      id: p.id,
      slug: p.slug,
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
