import Link from "next/link";
import BrandLogo from "@/components/brand/brand-logo";
import { T } from "@/components/i18n/t";
import { ArrowRightIcon } from "@/components/brand/icons";
import { DEFAULT_LOGO_URL } from "@/lib/site-defaults";

/**
 * Concise "About the publisher / முத்தமிழறிஞர் பதிப்பகம்" strip on the home page.
 * Renders Asset A once (lazy-loaded) with strictly 2 lines of factual text using only:
 * Muthamilarignar Pathipagam, Tamil books, Dravidian movement, Kalaignar.
 */
export default function PublisherStory({
  logoUrl = DEFAULT_LOGO_URL,
}: {
  totalBooks?: number;
  logoUrl?: string;
}) {
  return (
    <section
      aria-label="About the publisher / முத்தமிழறிஞர் பதிப்பகம்"
      className="border-y border-black/[0.08] bg-[#FAFAFA] py-12 sm:py-16"
    >
      <div className="container-site">
        <div className="flex flex-col items-start gap-6 rounded-3xl border border-black/10 bg-white p-6 shadow-card sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8 lg:px-10">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-6">
            <div className="inline-flex flex-shrink-0 rounded-2xl border border-black/10 bg-white px-3 py-2 shadow-sm">
              <BrandLogo
                src={logoUrl}
                targetWidth={256}
                sizes="(max-width: 640px) 79px, 89px"
                className="h-[64px] sm:h-[72px]"
              />
            </div>

            <div className="max-w-2xl">
              <p className="eyebrow">
                <T ta="பதிப்பகம் பற்றி" en="About the publisher" />
              </p>
              <h2 className="mt-1 text-[22px] font-extrabold tracking-tight text-black sm:text-[26px]">
                <T ta="முத்தமிழறிஞர் பதிப்பகம்" en="About the publisher — Muthamilarignar Pathipagam" />
              </h2>
              <div className="mt-2.5 space-y-1 text-[16px] leading-relaxed text-black/80">
                <p>
                  <T
                    ta="முத்தமிழறிஞர் பதிப்பகம் தமிழ் நூல்களுக்கான பதிப்பகமாகும்."
                    en="Muthamilarignar Pathipagam is a publishing house for Tamil books."
                  />
                </p>
                <p>
                  <T
                    ta="திராவிட இயக்கம் மற்றும் கலைஞர் குறித்த நூல்களை இங்கு காணலாம்."
                    en="Discover publications on the Dravidian movement and Kalaignar."
                  />
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/about"
            prefetch={false}
            className="btn-outline h-12 flex-shrink-0 px-6 text-[15px]"
          >
            <T ta="மேலும் அறிய" en="About publisher" />
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
