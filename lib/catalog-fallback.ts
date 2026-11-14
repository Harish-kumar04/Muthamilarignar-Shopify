import { cache } from "react";
import { DEFAULT_LOGO_URL } from "./site-defaults";

export const FALLBACK_CATEGORIES = [
  {
    id: "cat-dravidian-history",
    name: "திராவிட இயக்க வரலாறு | Dravidian Movement History",
    slug: "dravidian-history",
    description:
      "Books on the history, ideology, and struggles of the Dravidian movement and DMK.",
  },
  {
    id: "cat-kalaignar-works",
    name: "கலைஞர் படைப்புகள் | Kalaignar Works & Studies",
    slug: "kalaignar-works",
    description:
      "Biographies, letters, literary works, and political analyses of Muthamilarignar Kalaignar M. Karunanidhi.",
  },
  {
    id: "cat-dravidian-model",
    name: "திராவிட மாடல் & சமூகநீதி | Dravidian Model & Social Justice",
    slug: "dravidian-model-social-justice",
    description:
      "Publications on the Dravidian Model governance, reservation, state autonomy, and language rights.",
  },
  {
    id: "cat-dravidian-cinema",
    name: "திராவிட சினிமா & பண்பாடு | Dravidian Cinema & Culture",
    slug: "dravidian-cinema-culture",
    description:
      "Explorations of Dravidian cinema, art, cultural transformation, and youth movement.",
  },
];

export const FALLBACK_STORE = {
  id: "store-muthamilarignar-pathipagam",
  name: "Muthamilarignar Pathipagam",
  slug: "demo-store-main",
  description:
    "முத்தமிழறிஞர் பதிப்பகம் — திராவிட இயக்க வரலாறு, சமூகநீதி மற்றும் கலைஞர் படைப்புகள் | Official Bookstore of Muthamilarignar Pathipagam.",
  logo_url: DEFAULT_LOGO_URL,
  currency: "INR",
  theme_config: {
    primary_color: "#E52320",
    secondary_color: "#0a0a0a",
    logo_url: DEFAULT_LOGO_URL,
  },
  status: "published",
};

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isDatabaseProductId(id: unknown): boolean {
  // TODO shopify: accept Shopify Product/Variant GID (`gid://shopify/Product/...`) as well
  return (
    typeof id === "string" &&
    (UUID_RE.test(id.trim()) || id.trim().startsWith("gid://shopify/"))
  );
}

export interface CatalogBook {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category_id: string;
  price_cents: number;
  sale_price_cents?: number | null;
  tax_class: string;
  inventory: number;
  inventory_quantity: number;
  description: string;
  ingredients: string;
  safety_info: string;
  image_url: string | null;
  images: string[];
  status: string;
  is_fallback?: boolean;
}

export const FALLBACK_BOOKS: CatalogBook[] = [];

export const fetchBooksSafe = cache(
  async (_tenant: string): Promise<{ books: any[]; isFallback: boolean }> => {
    // TODO shopify: fetch products from Shopify Storefront GraphQL API (`products(first: 100)`)
    return { books: FALLBACK_BOOKS, isFallback: false };
  },
);

export async function getBooksWithFallback(tenant: string) {
  // TODO shopify: map Shopify product nodes to CatalogBook shape
  const result = await fetchBooksSafe(tenant);
  return result.books;
}

export const getCategoriesWithFallback = cache(async (_tenant: string) => {
  // TODO shopify: fetch collections from Shopify Storefront GraphQL API (`collections(first: 20)`)
  return FALLBACK_CATEGORIES;
});

export const getStoreWithFallback = cache(async (_tenant: string) => {
  // TODO shopify: fetch shop metadata from Shopify Storefront GraphQL API (`shop { ... }`)
  return FALLBACK_STORE;
});

export type BookLookupResult =
  | { status: "ok"; product: any }
  | { status: "not_found" }
  | { status: "gone" }
  | { status: "error"; httpStatus?: number };

export const fetchBookById = cache(
  async (_tenant: string, _productIdOrSlug: string): Promise<BookLookupResult> => {
    // TODO shopify: fetch single book via `product(handle: $slug)` from Shopify Storefront API
    return { status: "not_found" };
  },
);

export async function getBookByIdWithFallback(
  tenant: string,
  productIdOrSlug: string,
) {
  const res = await fetchBookById(tenant, productIdOrSlug);
  if (res.status === "ok") return res.product;
  return null;
}
