"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ProductCard, { toCardProduct } from "@/components/product/product-card";
import { useLanguage } from "@/components/language-provider";
import { T } from "@/components/i18n/t";
import PenLoader from "@/components/ui/pen-loader";

type Category = { id: string; name: string; slug?: string };
type SortKey = "default" | "newest" | "price-asc" | "price-desc";
type PageInfo = { hasNextPage: boolean; endCursor: string | null };

const VALID_SORTS: readonly SortKey[] = ["default", "newest", "price-asc", "price-desc"];

function findCategory(categories: Category[], key: string | null): Category | undefined {
  if (!key || key === "all") return undefined;
  const k = key.toLowerCase();
  return categories.find(
    (c) => (c.slug || "").toLowerCase() === k || String(c.id).toLowerCase() === k,
  );
}

export default function BooksCatalogClient({
  products,
  categories,
  initialPageInfo = { hasNextPage: false, endCursor: null },
  apiUnavailable = false,
}: {
  products: any[];
  categories: Category[];
  initialPageInfo?: PageInfo;
  apiUnavailable?: boolean;
}) {
  const { t, localizeName } = useLanguage();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("default");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [saleOnly, setSaleOnly] = useState(false);

  const [cursor, setCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([]);
  const [items, setItems] = useState<any[]>(products);
  const [pageInfo, setPageInfo] = useState<PageInfo>(initialPageInfo);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(apiUnavailable);
  const hydratedRef = useRef(false);

  const sortOptions: { value: SortKey; label: string }[] = useMemo(
    () => [
      { value: "default", label: t("பரிந்துரை", "Featured") },
      { value: "newest", label: t("புதிய வரவுகள்", "Newest First") },
      { value: "price-asc", label: t("விலை: குறைந்தது முதல்", "Price: Low to High") },
      { value: "price-desc", label: t("விலை: அதிகம் முதல்", "Price: High to Low") },
    ],
    [t],
  );

  const selectedSortLabel =
    sortOptions.find((opt) => opt.value === sortBy)?.label ?? sortOptions[0].label;

  const syncUrlParams = useCallback(
    (next: {
      q?: string;
      category?: string;
      sort?: SortKey;
      sale?: boolean;
      stock?: boolean;
      after?: string | null;
    }) => {
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      const qVal = (next.q ?? "").trim();
      if (qVal) url.searchParams.set("q", qVal);
      else {
        url.searchParams.delete("q");
        url.searchParams.delete("search");
      }

      if (next.category && next.category !== "all") {
        url.searchParams.set("category", next.category);
      } else {
        url.searchParams.delete("category");
      }

      if (next.sort && next.sort !== "default") {
        url.searchParams.set("sort", next.sort);
      } else {
        url.searchParams.delete("sort");
      }

      if (next.sale) url.searchParams.set("sale", "1");
      else url.searchParams.delete("sale");

      if (next.stock) url.searchParams.set("stock", "1");
      else url.searchParams.delete("stock");

      if (next.after) url.searchParams.set("after", next.after);
      else url.searchParams.delete("after");

      window.history.replaceState(window.history.state, "", url.toString());
    },
    [],
  );

  // Hydrate initial filter/sort/cursor from URL query string
  useEffect(() => {
    const apply = () => {
      const params = new URLSearchParams(window.location.search);
      const catKey = params.get("category");
      const matchedCat = findCategory(categories, catKey);
      setSelectedCategory(matchedCat?.slug || matchedCat?.id || (catKey ? catKey : "all"));

      const sortParam = params.get("sort") as SortKey | null;
      setSortBy(sortParam && VALID_SORTS.includes(sortParam) ? sortParam : "default");

      setSaleOnly(params.get("sale") === "1");
      setInStockOnly(params.get("stock") === "1");

      const q = params.get("q") || params.get("search") || "";
      const cleanQ = q === "1" ? "" : q;
      setSearch(cleanQ);
      setDebouncedSearch(cleanQ);

      const afterParam = params.get("after");
      setCursor(afterParam || null);
      hydratedRef.current = true;
    };
    apply();
    window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
  }, [categories]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = search.trim();
      setDebouncedSearch((prev) => {
        if (prev !== trimmed) {
          setCursor(null);
          setCursorHistory([]);
        }
        return trimmed;
      });
    }, 280);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Shopify products via /api/books when filters, sort, search, or cursor are active
  useEffect(() => {
    if (!hydratedRef.current) return;

    const isDefaultQuery =
      !debouncedSearch &&
      selectedCategory === "all" &&
      sortBy === "default" &&
      !inStockOnly &&
      !saleOnly &&
      !cursor;

    syncUrlParams({
      q: debouncedSearch,
      category: selectedCategory,
      sort: sortBy,
      sale: saleOnly,
      stock: inStockOnly,
      after: cursor,
    });

    if (isDefaultQuery) {
      setItems(products);
      setPageInfo(initialPageInfo);
      setUnavailable(apiUnavailable);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const qs = new URLSearchParams();
    if (debouncedSearch) qs.set("q", debouncedSearch);
    if (selectedCategory !== "all") qs.set("category", selectedCategory);
    if (sortBy !== "default") qs.set("sort", sortBy);
    if (inStockOnly) qs.set("stock", "1");
    if (saleOnly) qs.set("sale", "1");
    if (cursor) qs.set("after", cursor);

    fetch(`/api/books?${qs.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok || data?.unavailable) {
          setUnavailable(true);
          setItems([]);
          setPageInfo({ hasNextPage: false, endCursor: null });
          return;
        }
        setUnavailable(false);
        setItems(Array.isArray(data?.products) ? data.products : []);
        setPageInfo(
          data?.pageInfo ?? {
            hasNextPage: false,
            endCursor: null,
          },
        );
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setUnavailable(true);
        setItems([]);
        setPageInfo({ hasNextPage: false, endCursor: null });
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [
    debouncedSearch,
    selectedCategory,
    sortBy,
    inStockOnly,
    saleOnly,
    cursor,
    products,
    initialPageInfo,
    apiUnavailable,
    syncUrlParams,
  ]);

  useEffect(() => {
    if (!sortOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSortOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [sortOpen]);

  const selectSort = (value: SortKey) => {
    setSortBy(value);
    setSortOpen(false);
    setCursor(null);
    setCursorHistory([]);
  };

  const selectCategory = useCallback((slugOrId: string) => {
    setSelectedCategory(slugOrId);
    setCursor(null);
    setCursorHistory([]);
  }, []);

  const toggleSale = () => {
    setSaleOnly((prev) => !prev);
    setCursor(null);
    setCursorHistory([]);
  };

  const toggleInStock = () => {
    setInStockOnly((prev) => !prev);
    setCursor(null);
    setCursorHistory([]);
  };

  const goNextPage = () => {
    if (!pageInfo.hasNextPage || !pageInfo.endCursor) return;
    setCursorHistory((prev) => [...prev, cursor]);
    setCursor(pageInfo.endCursor);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goPrevPage = () => {
    if (cursorHistory.length === 0) {
      setCursor(null);
      return;
    }
    const nextStack = [...cursorHistory];
    const prevCursor = nextStack.pop() ?? null;
    setCursorHistory(nextStack);
    setCursor(prevCursor);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const pill = (active: boolean) =>
    `inline-flex min-h-[44px] items-center whitespace-nowrap rounded-full px-4 py-2 text-[13.5px] font-semibold transition-all ${
      active
        ? "bg-[#D11D1A] text-white shadow-glow"
        : "border border-black/15 bg-white text-black hover:border-brand-red-dark hover:text-brand-red-dark"
    }`;

  const pageNumber = cursor ? cursorHistory.length + 2 : 1;
  const hasPrevPage = Boolean(cursor);

  return (
    <div className="container-site pt-4 pb-10 sm:pt-5 sm:pb-14">
      <h1 className="sr-only">
        <T ta="அனைத்து நூல்கள்" en="All books" />
      </h1>

      {/* Row 1: Search and Sort on the same row */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="catalog-search" className="sr-only">
            {t("நூல்களைத் தேடுக", "Search books")}
          </label>
          <input
            id="catalog-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(
              "நூல் பெயர் அல்லது ஆசிரியர் மூலம் தேடுக…",
              "Search in Tamil or English by title or author…",
            )}
            className="h-11 w-full rounded-full border border-black/20 bg-white pl-10 pr-3.5 text-[14px] text-black placeholder:text-black/55 focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20 sm:h-12 sm:pl-11 sm:pr-4 sm:text-[14.5px]"
          />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/55 sm:left-4"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>

        {/* Sort selector */}
        <div ref={sortRef} className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setSortOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={sortOpen}
            className={`flex h-11 items-center justify-between gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-red/20 sm:h-12 sm:gap-2.5 sm:px-5 sm:text-[14px] ${
              sortBy !== "default"
                ? "border-brand-red bg-brand-red/5 text-brand-red-dark"
                : "border-black/20 bg-white text-black hover:border-black/40"
            }`}
          >
            <span className="max-w-[112px] truncate sm:max-w-none">
              <span className="mr-1 hidden font-medium text-black/65 sm:inline">
                {t("வரிசை:", "Sort:")}
              </span>
              <span>{selectedSortLabel}</span>
            </span>
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
              className={`h-4 w-4 flex-shrink-0 transition-transform ${sortOpen ? "rotate-180" : ""}`}
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {sortOpen && (
            <ul
              role="listbox"
              aria-label={t("வரிசைப்படுத்து", "Sort options")}
              className="absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-2xl border border-black/10 bg-white py-1.5 shadow-xl sm:w-64"
            >
              {sortOptions.map((opt) => {
                const active = opt.value === sortBy;
                return (
                  <li key={opt.value} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onClick={() => selectSort(opt.value)}
                      className={`flex min-h-[44px] w-full items-center justify-between px-4 py-2.5 text-left text-[13.5px] transition-colors ${
                        active
                          ? "bg-brand-red/10 font-bold text-brand-red-dark"
                          : "font-medium text-black/80 hover:bg-black/[0.04]"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {active && (
                        <span aria-hidden="true" className="font-extrabold text-brand-red-dark">
                          ✓
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Row 2: Single compact horizontally-scrollable row for category chips + On Sale / In Stock toggles */}
      <div
        role="group"
        aria-label={t("வடிகட்டிகள்", "Catalog filters")}
        className="no-scrollbar mt-2.5 mb-3.5 flex items-center gap-2 overflow-x-auto py-0.5 sm:gap-2.5"
      >
        {categories.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => selectCategory("all")}
              aria-pressed={selectedCategory === "all"}
              className={`flex-shrink-0 ${pill(selectedCategory === "all")}`}
            >
              {t("அனைத்தும்", "All")}
            </button>
            {categories.map((cat) => {
              const key = cat.slug || cat.id;
              const active =
                selectedCategory.toLowerCase() === key.toLowerCase() ||
                selectedCategory.toLowerCase() === String(cat.id).toLowerCase();
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => selectCategory(key)}
                  aria-pressed={active}
                  className={`flex-shrink-0 ${pill(active)}`}
                >
                  {localizeName(cat.name)}
                </button>
              );
            })}
            <span aria-hidden="true" className="h-5 w-px flex-shrink-0 bg-black/15" />
          </>
        )}

        <button
          type="button"
          onClick={toggleSale}
          aria-pressed={saleOnly}
          className={`inline-flex min-h-[44px] flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold transition-all ${
            saleOnly
              ? "bg-[#D11D1A] text-white shadow-glow"
              : "border border-black/20 bg-white text-black/80 hover:border-brand-red-dark hover:text-brand-red-dark"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-4 w-4 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          {t("சலுகை நூல்கள் மட்டும்", "On Sale Only")}
        </button>

        <button
          type="button"
          onClick={toggleInStock}
          aria-pressed={inStockOnly}
          className={`inline-flex min-h-[44px] flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold transition-all ${
            inStockOnly
              ? "bg-black text-white"
              : "border border-black/20 bg-white text-black/80 hover:border-black/50"
          }`}
        >
          <span aria-hidden="true" className="h-2 w-2 flex-shrink-0 rounded-full bg-green-600" />
          {t("கையிருப்பில் உள்ளவை மட்டும்", "In Stock Only")}
        </button>

        {loading && (
          <span className="ml-1 inline-flex flex-shrink-0 items-center gap-2 text-[13px] font-medium text-black/65">
            <PenLoader size="sm" label={t("ஏற்றுகிறது", "Loading")} />
          </span>
        )}
      </div>

      <h2 className="sr-only">{t("நூல் பட்டியல்", "Books catalog")}</h2>
      <p className="sr-only" role="status" aria-live="polite">
        {t(`${items.length} நூல்கள்`, `${items.length} books`)}
      </p>

      {/* Book Grid, Unavailable State, or Empty State */}
      {unavailable ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-6 py-16 text-center">
          <p className="text-[17px] font-bold text-black">
            Store is temporarily unavailable
          </p>
          <p className="mt-1.5 text-[14px] text-black/65">
            {t(
              "சேவையகம் தற்காலிகமாகக் கிடைக்கவில்லை, மீண்டும் முயற்சிக்கவும்.",
              "Please try again shortly.",
            )}
          </p>
        </div>
      ) : items.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-black/15 px-6 py-20 text-center">
          <p className="text-[16px] text-black/60">
            {t(
              "உங்கள் தேடலுக்குப் பொருந்தும் நூல்கள் எதுவும் கிடைக்கவில்லை.",
              "No books matched your search or filter.",
            )}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setDebouncedSearch("");
              setSelectedCategory("all");
              setSortBy("default");
              setSaleOnly(false);
              setInStockOnly(false);
              setCursor(null);
              setCursorHistory([]);
            }}
            className="btn-red mt-5 h-11 text-[14px]"
          >
            {t("அனைத்து நூல்களையும் காட்டு", "Show all books")}
          </button>
        </div>
      ) : (
        <>
          <div
            className={`grid grid-cols-2 gap-4 transition-opacity sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 xl:grid-cols-5 ${
              loading ? "opacity-60" : "opacity-100"
            }`}
          >
            {items.map((p: any) => (
              <ProductCard
                key={p.id}
                product={toCardProduct(p)}
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 260px"
              />
            ))}
          </div>

          {/* Cursor Pagination Controls */}
          {(hasPrevPage || pageInfo.hasNextPage) && (
            <nav
              aria-label={t("பக்க வழிசெலுத்தல்", "Catalog pagination")}
              className="mt-10 flex items-center justify-center gap-4 border-t border-black/10 pt-8"
            >
              <button
                type="button"
                onClick={goPrevPage}
                disabled={!hasPrevPage || loading}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-black/20 bg-white px-5 py-2 text-[14px] font-bold text-black transition-colors hover:border-brand-red-dark hover:text-brand-red-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span aria-hidden="true">←</span>
                <span>{t("முந்தைய பக்கம்", "Previous")}</span>
              </button>

              <span className="text-[13.5px] font-semibold text-black/70">
                {t(`பக்கம் ${pageNumber}`, `Page ${pageNumber}`)}
              </span>

              <button
                type="button"
                onClick={goNextPage}
                disabled={!pageInfo.hasNextPage || !pageInfo.endCursor || loading}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-black px-5 py-2 text-[14px] font-bold text-white transition-colors hover:bg-[#D11D1A] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span>{t("அடுத்த பக்கம்", "Next")}</span>
                <span aria-hidden="true">→</span>
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
