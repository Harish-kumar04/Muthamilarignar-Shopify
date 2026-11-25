import Link from "next/link";
import Img from "@/components/ui/img";
import { T } from "@/components/i18n/t";
import { ArrowRightIcon } from "@/components/brand/icons";
import { SunburstBackdrop } from "@/components/brand/patterns";
import { KALAIGNAR_ABOUT_COPY } from "@/lib/i18n";
import { DEFAULT_LOGO_URL, cloudinaryImageUrl } from "@/lib/site-defaults";

/** Pencil sketch of Kalaignar speaking at a microphone (intrinsic 1120x1404). */
const KALAIGNAR_SPEECH_ART_URL =
  "https://res.cloudinary.com/dikaxqooz/image/upload/v1790526460/1_cavhvy.webp";

/** Portrait illustration of M. K. Stalin (intrinsic 735x919, 4:5 ratio). */
const STALIN_ART_URL =
  "https://res.cloudinary.com/dikaxqooz/image/upload/v1794754146/M_K_Stalin_Art_fqp4fs.jpg";

/** Monochrome seated portrait sketch of Udhayanidhi Stalin (intrinsic 1122x1402, 4:5 ratio). */
const UDHAYANIDHI_SEATED_PORTRAIT_URL =
  "https://res.cloudinary.com/dikaxqooz/image/upload/v1795543292/Monochrome_Seated_Portrait_Sketch_sbtcsz.png";

type Bi = { readonly ta: string; readonly en: string };

const BODY_TEXT_CLASS =
  "text-base leading-[1.7] text-black/80 sm:text-[1.0625rem] [&_.i18n-ta]:text-[1.0625rem]";

/** Framed, lazy-loaded monochrome portrait with a reserved aspect ratio (no layout shift). */
function PortraitFrame({
  src,
  alt,
  aspectClass,
  className = "",
}: {
  src: string;
  alt: Bi;
  aspectClass: string;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[18.75rem] sm:max-w-[21.25rem] md:max-w-[25rem] ${className}`}>
      <div
        className={`relative ${aspectClass} w-full overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-card`}
      >
        <Img
          src={cloudinaryImageUrl(src, 800)}
          alt={`${alt.ta} / ${alt.en}`}
          fill
          sizes="(max-width: 640px) 300px, (max-width: 767px) 340px, 400px"
          className="object-contain p-1.5"
        />
      </div>
    </div>
  );
}

function BlockHeading({ heading, role }: { heading: Bi; role?: Bi }) {
  return (
    <>
      <h2 className="text-[1.375rem] font-extrabold leading-[1.25] tracking-tight text-black sm:text-[1.625rem]">
        <T ta={heading.ta} en={heading.en} />
      </h2>
      {role && (
        <p className="mt-1 text-[0.90625rem] font-bold text-brand-red-dark sm:text-[0.9375rem]">
          <T ta={role.ta} en={role.en} />
        </p>
      )}
      <div aria-hidden="true" className="mt-2.5 h-1 w-12 rounded-full bg-brand-red" />
    </>
  );
}

function LeaderCard({
  heading,
  role,
  body,
  imageSrc,
  imageAlt,
}: {
  heading: Bi;
  role?: Bi;
  body: Bi;
  imageSrc?: string | null;
  imageAlt?: string;
}) {
  return (
    <article className="grid grid-cols-1 items-center gap-6 rounded-2xl border border-black/10 bg-white p-5 shadow-card sm:p-7 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-10 lg:gap-12">
      {imageSrc ? (
        <div className="order-first mx-auto w-full max-w-[16.25rem] md:order-1 md:max-w-[20rem]">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-black/[0.08] bg-[#FAFAFA]">
            <Img
              src={cloudinaryImageUrl(imageSrc, 640)}
              alt={imageAlt || ""}
              fill
              sizes="(max-width: 768px) 260px, 320px"
              className="object-contain object-center p-1.5"
            />
          </div>
        </div>
      ) : null}
      <div className="min-w-0 md:order-2">
        <BlockHeading heading={heading} role={role} />
        <p className={`mt-3 max-w-[68ch] ${BODY_TEXT_CLASS}`}>
          <T ta={body.ta} en={body.en} />
        </p>
      </div>
    </article>
  );
}

/**
 * Home-page About / leaders section (Server Component, zero client JS):
 * 1. Muthamizharignar Kalaignar — framed Kalaignar sketch beside text (above it on mobile)
 * 2. Hon'ble M.K. Stalin & 3. Hon'ble Udhayanidhi Stalin — cards with 4:5 top photos
 * 4. Muthamizharignar Pathippagam — text beside framed Pathipagam logo (above on mobile)
 * Height grows naturally with content; all images are lazy-loaded (below the fold, never LCP).
 */
export function KalaignarArtworkBanner() {
  const { kalaignar, stalin, udhayanidhi, pathippagam } = KALAIGNAR_ABOUT_COPY;

  return (
    <section
      id="kalaignar-books-banner"
      aria-label="முத்தமிழறிஞர் கலைஞர் | Muthamizharignar Kalaignar"
      className="pattern-red-dots relative overflow-hidden border-y border-black/[0.08] bg-white py-10 sm:py-14"
    >
      <h1 className="sr-only">
        <T
          ta={KALAIGNAR_ABOUT_COPY.srOnlyHeading.ta}
          en={KALAIGNAR_ABOUT_COPY.srOnlyHeading.en}
        />
      </h1>

      <SunburstBackdrop position="right" />

      <div className="container-site relative">
        {/* Block 1: Kalaignar — framed portrait beside text (desktop), above text (mobile) */}
        <article className="grid grid-cols-1 items-center gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-10 lg:gap-12">
          <PortraitFrame
            src={KALAIGNAR_SPEECH_ART_URL}
            alt={kalaignar.imageAlt}
            aspectClass="aspect-[1120/1404]"
          />

          <div className="min-w-0">
            <BlockHeading heading={kalaignar.heading} />
            <p className={`mt-3 max-w-[68ch] ${BODY_TEXT_CLASS}`}>
              <T ta={kalaignar.body.ta} en={kalaignar.body.en} />
            </p>
          </div>
        </article>

        {/* Blocks 2 & 3: Leaders (one by one) */}
        <div className="mt-5 flex flex-col gap-5 sm:gap-6 md:mt-6">
          <LeaderCard
            heading={stalin.heading}
            role={stalin.role}
            body={stalin.body}
            imageSrc={STALIN_ART_URL}
            imageAlt="மாண்புமிகு மு.க.ஸ்டாலின் / M.K. Stalin"
          />
          <LeaderCard
            heading={udhayanidhi.heading}
            role={udhayanidhi.role}
            body={udhayanidhi.body}
            imageSrc={UDHAYANIDHI_SEATED_PORTRAIT_URL}
            imageAlt="மாண்புமிகு உதயநிதி ஸ்டாலின் / Udhayanidhi Stalin"
          />
        </div>

        {/* Block 4: Muthamizharignar Pathippagam — text beside Pathipagam logo card (logo above text on mobile) */}
        <article className="mt-5 grid grid-cols-1 items-center gap-6 rounded-2xl border border-black/10 bg-white p-5 shadow-card sm:p-7 md:mt-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-10 lg:gap-12">
          <div className="min-w-0 md:order-1">
            <BlockHeading heading={pathippagam.heading} />
            <p className={`mt-3 max-w-[68ch] ${BODY_TEXT_CLASS}`}>
              <T ta={pathippagam.body.ta} en={pathippagam.body.en} />
            </p>
          </div>

          <div className="order-first mx-auto w-full max-w-[16.25rem] md:order-2 md:max-w-[20rem]">
            <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-2xl border border-black/[0.08] bg-white p-6 shadow-card sm:p-8">
              <div className="relative h-full w-full">
                <Img
                  src={cloudinaryImageUrl(DEFAULT_LOGO_URL, 640)}
                  alt="முத்தமிழறிஞர் பதிப்பகம் / Muthamizharignar Pathippagam logo"
                  fill
                  sizes="(max-width: 768px) 260px, 320px"
                  className="object-contain object-center"
                />
              </div>
            </div>
          </div>
        </article>

        <div className="mt-8">
          <Link
            href="/books"
            prefetch={false}
            className="btn-red h-11 px-6 text-[15px] shadow-glow"
          >
            <T
              ta={KALAIGNAR_ABOUT_COPY.viewBooks.ta}
              en={KALAIGNAR_ABOUT_COPY.viewBooks.en}
            />
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
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
