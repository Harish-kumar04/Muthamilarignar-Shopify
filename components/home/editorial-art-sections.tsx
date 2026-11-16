import Link from "next/link";
import Img from "@/components/ui/img";
import { T } from "@/components/i18n/t";
import { ArrowRightIcon } from "@/components/brand/icons";
import { SunburstBackdrop } from "@/components/brand/patterns";
import KalaignarAboutBlock from "@/components/home/kalaignar-about-block";
import { cloudinaryImageUrl } from "@/lib/site-defaults";

const KALAIGNAR_SPEECH_ART_URL =
  "https://res.cloudinary.com/dikaxqooz/image/upload/v1790526460/1_cavhvy.webp";

const STALIN_ART_URL =
  "https://res.cloudinary.com/dikaxqooz/image/upload/v1794754146/M_K_Stalin_Art_fqp4fs.jpg";

/**
 * Full-width editorial promo banner between home sections showcasing Asset B
 * (1120x1404 pencil illustration of Kalaignar speaking at a microphone).
 * Preserves intrinsic 1120x1404 aspect ratio with zero cropping or layout shift.
 */
export function KalaignarArtworkBanner() {
  return (
    <section
      id="kalaignar-books-banner"
      aria-label="முத்தமிழறிஞர் கலைஞர் ஓவியத் தொகுப்பு | Kalaignar Featured Banner"
      className="pattern-red-dots relative overflow-hidden border-y border-black/[0.08] bg-[#FAFAFA] py-12 sm:py-16"
    >
      <SunburstBackdrop position="right" />
      <div className="container-site relative">
        <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-card">
          <div className="grid grid-cols-1 items-center gap-8 p-6 sm:p-10 lg:grid-cols-12 lg:gap-12 lg:p-12">
            {/* Portrait Artwork Frame (Asset B: 1120x1404) */}
            <div className="mx-auto w-full max-w-[340px] sm:max-w-[380px] lg:col-span-5 lg:max-w-[420px]">
              <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white p-2 shadow-sm">
                <Img
                  src={cloudinaryImageUrl(KALAIGNAR_SPEECH_ART_URL, 840)}
                  alt="மேடையில் ஒலிவாங்கி முன் உரையாற்றும் முத்தமிழறிஞர் கலைஞர் ஓவியம் | Pencil sketch illustration of Kalaignar speaking at a microphone"
                  width={1120}
                  height={1404}
                  sizes="(max-width: 640px) 86vw, (max-width: 1024px) 380px, 420px"
                  className="h-auto w-full rounded-xl bg-white object-contain"
                />
              </div>
            </div>

            {/* Editorial Copy (strictly factual, no invented claims) */}
            <div className="lg:col-span-7">
              <p className="eyebrow">
                <T ta="முத்தமிழறிஞர் பதிப்பகம்" en="Muthamilarignar Pathipagam" />
              </p>
              <h2 className="mt-2 text-[26px] font-extrabold leading-[1.18] tracking-tight text-black sm:text-[34px] lg:text-[40px]">
                <T
                  ta="கலைஞர் மற்றும் திராவிட இயக்கத் தமிழ் நூல்கள்"
                  en="Kalaignar & Dravidian Movement Tamil Books"
                />
              </h2>
              <div aria-hidden="true" className="mt-3 h-1 w-14 rounded-full bg-brand-red" />
              <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-black/80 sm:text-[17px]">
                <T
                  ta="முத்தமிழறிஞர் பதிப்பகம் வெளியிடும் கலைஞர் மற்றும் திராவிட இயக்கம் தொடர்பான தமிழ் நூல்களை இணையத்தில் ஆர்டர் செய்யலாம்."
                  en="Browse Tamil books on Kalaignar and the Dravidian movement published by Muthamilarignar Pathipagam."
                />
              </p>

              <KalaignarAboutBlock />

              <div className="mt-7">
                <Link
                  href="/books"
                  prefetch={false}
                  className="btn-red h-12 px-7 text-[15.5px] shadow-glow"
                >
                  <T ta="நூல்களைக் காண்க" en="View books" />
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * "Kalaignar legacy / திராவிட இயக்க மரபு" feature section on the home page
 * showcasing Asset C (735x919 black-and-white portrait art of M. K. Stalin)
 * with a short caption and a "View books" button linking to /books.
 */
export function DravidianLegacyFeature() {
  return (
    <section
      aria-label="திராவிட இயக்க மரபு | Kalaignar legacy"
      className="relative overflow-hidden border-t border-black/[0.08] bg-white py-14 sm:py-20"
    >
      <div className="container-site relative">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Left: Heading, short caption, and View books CTA */}
          <div className="order-2 lg:order-1 lg:col-span-7">
            <p className="eyebrow">
              <T ta="திராவிட இயக்க மரபு" en="Kalaignar legacy" />
            </p>
            <h2 className="mt-2 text-[26px] font-extrabold leading-[1.18] tracking-tight text-black sm:text-[34px] lg:text-[40px]">
              <T
                ta="திராவிட இயக்க மரபு"
                en="Kalaignar legacy & Dravidian movement"
              />
            </h2>
            <div aria-hidden="true" className="mt-3 h-1 w-14 rounded-full bg-brand-red" />
            <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-black/80 sm:text-[17px]">
              <T
                ta="முத்தமிழறிஞர் பதிப்பகத்தின் திராவிட இயக்கம் மற்றும் கலைஞர் மரபு சார்ந்த தமிழ் நூல்கள் தொகுப்பு."
                en="Explore Tamil books on the Dravidian movement and Kalaignar legacy from Muthamilarignar Pathipagam."
              />
            </p>
            <div className="mt-7">
              <Link
                href="/books"
                prefetch={false}
                className="btn-black h-12 px-7 text-[15.5px]"
              >
                <T ta="நூல்களைக் காண்க" en="View books" />
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Right: Portrait Artwork Frame (Asset C: 735x919) */}
          <div className="order-1 mx-auto w-full max-w-[300px] sm:max-w-[340px] lg:order-2 lg:col-span-5 lg:max-w-[360px]">
            <figure className="overflow-hidden rounded-3xl border border-black/10 bg-[#FAFAFA] p-3 shadow-card">
              <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
                <Img
                  src={cloudinaryImageUrl(STALIN_ART_URL, 735)}
                  alt="மு. க. ஸ்டாலின் அவர்களின் கருப்பு-வெள்ளை உருவ ஓவியம் | Black-and-white portrait illustration of M. K. Stalin"
                  width={735}
                  height={919}
                  sizes="(max-width: 640px) 82vw, 360px"
                  className="h-auto w-full bg-white object-contain"
                />
              </div>
              <figcaption className="mt-2.5 px-1 text-center text-[13.5px] font-medium text-black/70">
                <T
                  ta="மு. க. ஸ்டாலின் — உருவ ஓவியம்"
                  en="M. K. Stalin — Portrait Illustration"
                />
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}

const WHITE_LOGO_BANNER_URL =
  "https://res.cloudinary.com/dikaxqooz/image/upload/v1794758234/shopify_white_logo_banner_8k_rn9z1s.png";

/**
 * Dark brand strip near the bottom of the home page showcasing Asset D
 * (`shopify_white_logo_banner_8k_rn9z1s.png`, intrinsic 1200x323 wide banner).
 * Placed exclusively on a rich black + red-accented band so the panoramic banner
 * stands out with crisp contrast while keeping its red/black publisher emblem sharp.
 */
export function DarkBrandBannerStrip() {
  return (
    <section
      aria-label="முத்தமிழறிஞர் பதிப்பகம் அடையாளப் பதாகை | Muthamilarignar Pathipagam Brand Strip"
      className="pattern-white-dots relative overflow-hidden border-y-2 border-brand-red bg-brand-black py-10 sm:py-14"
    >
      <div className="container-site relative">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-white/15 bg-white shadow-2xl">
          <Img
            src={cloudinaryImageUrl(WHITE_LOGO_BANNER_URL, 1200)}
            alt="முத்தமிழறிஞர் பதிப்பகம் அதிகாரப்பூர்வ இலச்சினைப் பதாகை | Muthamilarignar Pathipagam Official Publisher Logo Banner"
            width={1200}
            height={323}
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 86vw, 896px"
            className="h-auto w-full object-contain"
          />
        </div>
      </div>
    </section>
  );
}
