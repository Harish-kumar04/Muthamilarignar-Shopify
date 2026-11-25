import Link from "next/link";
import { T } from "@/components/i18n/t";
import { ArrowRightIcon } from "@/components/brand/icons";
import { SunburstBackdrop } from "@/components/brand/patterns";
import HeroBooksCarousel from "@/components/home/hero-books-carousel";
import type { CardProduct } from "@/components/product/product-card";

/**
 * Brand landing hero (Server Component shell + right-side client carousel island):
 * - Left: Publisher pill, bold bilingual H1, concise subtext, >=48px pill CTA ("Browse books")
 * - Right: 3D coverflow featured-books carousel over a Revolutionary Red arch + sunrise halo
 * - Bottom: Bold 4-column stats row fed strictly from real store/catalog numbers
 */
export default function BrandHero({
  heroBooks,
  totalBooks,
  categoryCount,
  apiUnavailable = false,
}: {
  heroBooks: CardProduct[];
  totalBooks: number;
  categoryCount: number;
  apiUnavailable?: boolean;
}) {
  const seenHeroCovers = new Set<string>();
  const covers = heroBooks
    .filter((b) => {
      if (!b.image_url) return false;
      if (seenHeroCovers.has(b.image_url)) return false;
      seenHeroCovers.add(b.image_url);
      return true;
    })
    .slice(0, 6);
  const carouselBooks = covers.length > 0 ? covers : heroBooks.slice(0, 6);

  const stats = [
    {
      value: totalBooks > 0 ? `${totalBooks}` : "—",
      ta: "வெளியிடப்பட்ட நூல்கள்",
      en: "Published Titles",
    },
    categoryCount > 1
      ? {
          value: `${categoryCount}`,
          ta: "நூல் பிரிவுகள்",
          en: "Subject Categories",
        }
      : {
          value: "100%",
          ta: "நேரடிப் பதிப்பக வெளியீடுகள்",
          en: "Official Publisher Editions",
        },
    {
      value: "Pan-India",
      ta: "இந்தியா முழுவதும் டெலிவரி உண்டு",
      en: "Pan-India delivery available",
    },
    {
      value: "COD",
      ta: "புத்தகம் வந்ததும் பணம்",
      en: "Cash on Delivery",
    },
  ];

  return (
    <section
      aria-label="Muthamilarignar Pathipagam Hero"
      className="relative overflow-hidden border-b border-black/[0.08] bg-white pt-6 pb-10 sm:pt-10 sm:pb-14 lg:pt-12 lg:pb-16"
    >
      <SunburstBackdrop position="right" />

      <div className="container-site relative">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Bilingual H1 + Pill CTAs */}
          <div className="lg:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-red/25 bg-brand-red-light px-3.5 py-1.5 text-[0.75rem] font-bold text-brand-red-dark">
              <span className="h-2 w-2 rounded-full bg-brand-red" aria-hidden="true" />
              <T
                ta="முத்தமிழறிஞர் பதிப்பகம் • அதிகாரப்பூர்வ இணைய நூலகம்"
                en="Muthamilarignar Pathipagam • Official Bookstore"
              />
            </div>

            <h1 className="mt-4 text-[2rem] font-extrabold leading-[1.12] tracking-tight text-black sm:text-[2.875rem] lg:text-[3.5rem]">
              <T
                ta="அறிவாற்றலும் சமூகநீதிச் சிந்தனையும் ஒவ்வொரு பக்கத்திலும்."
                en="Books on the Dravidian Movement, Social Justice & Kalaignar."
              />
            </h1>

            <div aria-hidden="true" className="mt-4 h-1.5 w-16 rounded-full bg-brand-red" />

            <p className="mt-4 max-w-xl text-base leading-relaxed text-black/80 sm:text-[1.09375rem]">
              <T
                ta="திராவிட இயக்கம், சமூகநீதி மற்றும் முத்தமிழறிஞர் கலைஞர் குறித்த நூல்களை நேரடிப் பதிப்பகத் தரத்தில் உங்கள் இல்லத்திற்கே பெறுங்கள்."
                en="Order authentic printed editions of books about the Dravidian movement, social justice and Kalaignar — shipped across India."
              />
            </p>

            {/* Primary CTA (>=48px height) */}
            <div className="mt-7 flex flex-wrap items-center gap-3.5 sm:mt-8">
              <Link
                href="/books"
                className="btn-red h-12 px-7 text-[0.96875rem] shadow-glow sm:h-[3.25rem] sm:px-8 sm:text-base"
              >
                <T ta="நூல்களைக் காண்க" en="Browse books" />
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: Live 3D Featured-Books Carousel Client Island */}
          <div className="w-full lg:col-span-6">
            <HeroBooksCarousel books={carouselBooks} apiUnavailable={apiUnavailable} />
          </div>
        </div>

        {/* Bold Real-Data Stats Row */}
        <div
          aria-label="Bookstore highlights"
          className="mt-10 grid grid-cols-2 gap-3 rounded-2xl border border-black/10 bg-[#FAFAFA] p-4 shadow-card sm:mt-12 sm:grid-cols-4 sm:gap-4 sm:p-6"
        >
          {stats.map((st, idx) => (
            <div
              key={st.en}
              className={`flex flex-col justify-center px-2 py-1 text-center sm:text-left ${
                idx > 0 ? "sm:border-l sm:border-black/10 sm:pl-6" : ""
              }`}
            >
              <span className="text-[24px] font-extrabold tracking-tight text-brand-red sm:text-[30px]">
                {st.value}
              </span>
              <span className="mt-0.5 text-[12.5px] font-semibold text-black/80 sm:text-[13.5px]">
                <T ta={st.ta} en={st.en} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
