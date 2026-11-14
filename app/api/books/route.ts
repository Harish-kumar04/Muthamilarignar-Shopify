import { NextRequest, NextResponse } from "next/server";
import {
  getCollectionByHandle,
  listProducts,
  resolveCollectionSort,
  resolveProductSort,
  searchProducts,
  type ShopifyBook,
  type ShopifyPageInfo,
} from "@/lib/shopify";

function slimCatalogBook(p: ShopifyBook) {
  return {
    id: p.id,
    variant_id: p.variant_id,
    slug: p.slug,
    handle: p.handle,
    name: p.name,
    sku: p.sku,
    author: p.author,
    category_id: p.category_id,
    category_slug: p.category_slug,
    collection_ids: p.collection_ids,
    collection_handles: p.collection_handles,
    description: p.description,
    priceRupees: p.priceRupees,
    compareAtPriceRupees: p.compareAtPriceRupees,
    price_cents: p.price_cents,
    sale_price_cents: p.sale_price_cents,
    availableForSale: p.availableForSale,
    quantityAvailable: p.quantityAvailable,
    inventory: p.inventory,
    inventory_quantity: p.inventory_quantity,
    image_url: p.image_url,
    images: p.images,
    dimensions_json: p.dimensions_json,
  };
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const q = (sp.get("q") || "").trim();
  const category = (sp.get("category") || "").trim();
  const sort = (sp.get("sort") || "default").trim();
  const after = (sp.get("after") || "").trim() || null;
  const availableOnly = sp.get("stock") === "1";
  const saleOnly = sp.get("sale") === "1";
  const firstRaw = Number.parseInt(sp.get("first") || "24", 10);
  const first = Number.isFinite(firstRaw) ? Math.min(Math.max(firstRaw, 1), 48) : 24;

  try {
    let products: ShopifyBook[] = [];
    let pageInfo: ShopifyPageInfo = { hasNextPage: false, endCursor: null };

    if (category && category !== "all" && !q) {
      const colSort = resolveCollectionSort(sort);
      const colRes = await getCollectionByHandle(category, {
        first,
        after,
        sortKey: colSort.sortKey,
        reverse: colSort.reverse,
        availableOnly,
      });
      if (colRes) {
        products = colRes.products;
        pageInfo = colRes.pageInfo;
      }
    } else if (q) {
      const prodSort = resolveProductSort(sort, true);
      const res = await searchProducts({
        query: q,
        first,
        after,
        sortKey: prodSort.sortKey,
        reverse: prodSort.reverse,
        availableOnly,
      });
      products =
        category && category !== "all"
          ? res.products.filter(
              (b) =>
                b.collection_handles.some(
                  (h) => h.toLowerCase() === category.toLowerCase(),
                ) ||
                b.collection_ids.some(
                  (id) => id.toLowerCase() === category.toLowerCase(),
                ),
            )
          : res.products;
      pageInfo = res.pageInfo;
    } else {
      const prodSort = resolveProductSort(sort, false);
      const res = await listProducts({
        first,
        after,
        sortKey: prodSort.sortKey,
        reverse: prodSort.reverse,
        availableOnly,
      });
      products = res.products;
      pageInfo = res.pageInfo;
    }

    if (saleOnly) {
      products = products.filter(
        (b) => b.sale_price_cents !== null && b.sale_price_cents < b.price_cents,
      );
    }

    return NextResponse.json({
      unavailable: false,
      products: products.map(slimCatalogBook),
      pageInfo,
    });
  } catch {
    return NextResponse.json(
      {
        unavailable: true,
        error: "Store is temporarily unavailable",
        products: [],
        pageInfo: { hasNextPage: false, endCursor: null },
      },
      { status: 503 },
    );
  }
}
